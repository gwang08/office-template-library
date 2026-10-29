// Tiptap v3 instance for DOCX content. contentHtml is the single source of
// truth (no JSON column — YAGNI): mammoth HTML loads via `content`, every
// update streams getHTML() up to the page for the PATCH-on-save flow.
// The parent remounts this component with key={docId} per document, so a
// fresh useEditor per document is guaranteed — no cross-doc state bleed.
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { EditorToolbar } from './editor-toolbar';
import './editor.css';

export function RichEditor({
  contentHtml,
  onChange,
}: {
  /** Mammoth HTML from the document detail DTO. */
  contentHtml: string;
  /** Fires with the serialized editor HTML on every content change. */
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      // Free MIT kit: Table + TableRow/Cell/Header. Column resizing off —
      // mammoth drops widths anyway, keep the structure-only contract.
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: contentHtml,
    // Harmless in an SPA; avoids SSR-only crash if this ever renders pre-hydration.
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  return (
    <div className="editor-surface overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      {editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
