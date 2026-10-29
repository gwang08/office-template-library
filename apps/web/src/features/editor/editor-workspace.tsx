// Loaded editor surface: title input (dirty vs. last saved baseline), the
// Tiptap RichEditor, Save → PATCH {title, contentHtml} with a saved flash,
// and Download → export endpoint (browser handles the attachment stream).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportUrl, patchDocument, type DocumentDetailDto } from '../../lib/api';
import { RichEditor } from './rich-editor';

const SAVED_FLASH_MS = 2500;

export function EditorWorkspace({ doc }: { doc: DocumentDetailDto }) {
  // `current` is the last-saved baseline — dirty state derives from it.
  const [current, setCurrent] = useState(doc);
  const [title, setTitle] = useState(doc.title);
  const [contentDirty, setContentDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const contentRef = useRef<string>(doc.contentHtml ?? '');

  const dirty = title.trim() !== current.title || contentDirty;

  useEffect(() => {
    if (!savedFlash) return;
    const timer = setTimeout(() => setSavedFlash(null), SAVED_FLASH_MS);
    return () => clearTimeout(timer);
  }, [savedFlash]);

  const handleContentChange = useCallback((html: string) => {
    contentRef.current = html;
    setContentDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await patchDocument(current.id, {
        title: title.trim() || current.title,
        contentHtml: contentRef.current,
      });
      setCurrent(updated);
      contentRef.current = updated.contentHtml ?? contentRef.current;
      setContentDirty(false);
      setSavedFlash(`Saved · ${new Date(updated.updatedAt).toLocaleTimeString()}`);
    } catch (cause: unknown) {
      setSaveError(cause instanceof Error ? cause.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    // Attachment disposition: the browser downloads without leaving the page.
    window.location.assign(exportUrl(current.id));
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/documents"
          className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          ← My documents
        </Link>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="document-title" className="sr-only">
              Document title
            </label>
            <input
              id="document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Untitled document"
              className="w-full rounded-lg border border-transparent px-2 py-1 text-2xl font-bold tracking-tight text-slate-900 transition hover:border-slate-300 focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 flex flex-wrap items-center gap-2 px-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                {current.kind.toUpperCase()}
              </span>
              <span>from “{current.templateName}”</span>
              <span aria-hidden="true">·</span>
              <span>Updated {new Date(current.updatedAt).toLocaleString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Download
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </header>

        <div className="mt-2 flex min-h-6 items-center gap-3 px-2" role="status" aria-live="polite">
          {saveError ? (
            <p className="text-sm font-medium text-red-600">{saveError}</p>
          ) : savedFlash ? (
            <p className="text-sm font-medium text-emerald-600">{savedFlash}</p>
          ) : dirty ? (
            <p className="text-sm text-amber-600">Unsaved changes</p>
          ) : null}
        </div>

        {current.kind === 'docx' ? (
          <div className="mt-2">
            <RichEditor contentHtml={current.contentHtml ?? ''} onChange={handleContentChange} />
          </div>
        ) : (
          // Reached only by manual URL entry: pptx documents have no rich text.
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Presentation documents open in the slides editor — coming in a later phase.
            Use Download to get the file.
          </p>
        )}
      </div>
    </main>
  );
}
