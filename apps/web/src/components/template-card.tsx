// Library grid card: SVG thumbnail, name, clamped description, category + kind
// badges, slide count for decks. Whole card is one button (a11y).
import { assetUrl } from '../lib/api';
import type { TemplateDto } from '../lib/types';

const KIND_BADGE: Record<string, { label: string; className: string }> = {
  docx: { label: 'Word', className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  pptx: { label: 'Slides', className: 'bg-orange-50 text-orange-700 ring-orange-200' },
};

export function TemplateCard({
  template,
  onOpen,
}: {
  template: TemplateDto;
  onOpen: (template: TemplateDto) => void;
}) {
  const kind = KIND_BADGE[template.kind] ?? {
    label: template.kind,
    className: 'bg-slate-50 text-slate-700 ring-slate-200',
  };
  return (
    <button
      type="button"
      onClick={() => onOpen(template)}
      aria-label={`Preview ${template.name}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <div className="aspect-video overflow-hidden border-b border-slate-100 bg-slate-50">
        <img
          src={assetUrl(template.thumbnailKey)}
          alt={`${template.name} preview thumbnail`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-slate-900">{template.name}</h3>
        <p className="line-clamp-2 text-sm text-slate-500">{template.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {template.category}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${kind.className}`}>
            {kind.label}
          </span>
          {template.kind === 'pptx' && template.slideCount > 0 && (
            <span className="text-xs text-slate-400">{template.slideCount} slides</span>
          )}
        </div>
      </div>
    </button>
  );
}
