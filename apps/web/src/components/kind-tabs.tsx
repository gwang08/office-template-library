// File-type filter: All / Documents (docx) / Presentations (pptx).
// Toggle-group semantics (aria-pressed) — the "tabs" drive a filter, not panels.
import type { TemplateKind } from '../lib/types';

export type KindFilter = 'all' | TemplateKind;

const OPTIONS: { id: KindFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'docx', label: 'Documents' },
  { id: 'pptx', label: 'Presentations' },
];

export function KindTabs({
  value,
  onChange,
}: {
  value: KindFilter;
  onChange: (kind: KindFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter by file type"
      className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
