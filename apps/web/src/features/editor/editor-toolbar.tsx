// Formatting toolbar bound to the Tiptap chain API. Active states come from
// useEditorState (v3 no longer re-renders React on every transaction — the
// selector snapshot is the documented reactive pattern for UI state).
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import type { SyntheticEvent } from 'react';

/**
 * Keep the editor's selection intact when a toolbar button is pressed: the
 * default mousedown would blur the contenteditable and drop the text
 * selection — mark commands (bold/…) would then apply against a collapsed
 * caret instead of the highlighted text.
 */
const keepSelection = (event: SyntheticEvent) => event.preventDefault();

const BUTTON_BASE =
  'rounded-md px-2.5 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';
const BUTTON_IDLE = 'text-slate-600 hover:bg-slate-100';
const BUTTON_ACTIVE = 'bg-indigo-100 text-indigo-700';

function toolbarClasses(active: boolean): string {
  return `${BUTTON_BASE} ${active ? BUTTON_ACTIVE : BUTTON_IDLE}`;
}

interface ToolbarSnapshot {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  headingLevels: [boolean, boolean, boolean];
  bulletList: boolean;
  orderedList: boolean;
  canInsertTable: boolean;
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      headingLevels: [1, 2, 3].map(
        (level) => e.isActive('heading', { level }),
      ) as [boolean, boolean, boolean],
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      canInsertTable: e.can().insertTable(),
    }),
  }) as ToolbarSnapshot;

  // Mark + toggle actions — every button preserves the editor selection.
  const marks: Array<{ key: string; label: string; title: string; active: boolean; extra?: string; command: () => void }> = [
    {
      key: 'bold', label: 'B', title: 'Bold', active: state.bold, extra: 'font-bold',
      command: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic', label: 'I', title: 'Italic', active: state.italic, extra: 'italic',
      command: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'underline', label: 'U', title: 'Underline', active: state.underline, extra: 'underline',
      command: () => editor.chain().focus().toggleUnderline().run(),
    },
  ];
  const blocks: Array<{ key: string; label: string; title: string; active: boolean; command: () => void }> = [
    ...([1, 2, 3] as const).map((level, index) => ({
      key: `h${level}`,
      label: `H${level}`,
      title: `Heading ${level}`,
      active: state.headingLevels[index],
      command: () => editor.chain().focus().toggleHeading({ level }).run(),
    })),
    {
      key: 'bullet', label: '• List', title: 'Bulleted list', active: state.bulletList,
      command: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'ordered', label: '1. List', title: 'Numbered list', active: state.orderedList,
      command: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2"
      role="toolbar"
      aria-label="Document formatting"
    >
      {marks.map((button) => (
        <button
          key={button.key}
          type="button"
          onMouseDown={keepSelection}
          className={`${button.extra} ${toolbarClasses(button.active)}`}
          aria-pressed={button.active}
          title={button.title}
          onClick={button.command}
        >
          {button.label}
        </button>
      ))}

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

      {blocks.map((button) => (
        <button
          key={button.key}
          type="button"
          onMouseDown={keepSelection}
          className={toolbarClasses(button.active)}
          aria-pressed={button.active}
          title={button.title}
          onClick={button.command}
        >
          {button.label}
        </button>
      ))}

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

      <button
        type="button"
        onMouseDown={keepSelection}
        className={toolbarClasses(false)}
        disabled={!state.canInsertTable}
        title="Insert 2×2 table"
        onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}
      >
        + Table
      </button>
    </div>
  );
}
