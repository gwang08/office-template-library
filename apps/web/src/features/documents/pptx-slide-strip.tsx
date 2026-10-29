// Slide previews for the PPTX document page: the template's committed
// per-slide SVGs (same source as the preview-modal fallback). Loading,
// graceful-degradation notice, and the loaded grid.
import { Spinner } from '../../components/state-blocks';
import { assetUrl } from '../../lib/api';
import type { TemplateDetailDto } from '../../lib/types';

export type SlidesState =
  | { phase: 'loading' }
  | { phase: 'unavailable'; reason: string }
  | { phase: 'ok'; template: TemplateDetailDto };

export function SlideStrip({ slides }: { slides: SlidesState }) {
  if (slides.phase === 'loading') {
    return <Spinner label="Loading slide previews…" />;
  }
  if (slides.phase === 'unavailable') {
    return (
      <p
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
        role="status"
      >
        Slide previews are unavailable ({slides.reason}) — the .pptx download above still has
        every slide.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {slides.template.slides.map((slide) => (
        <figure
          key={slide.order}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <img
            src={assetUrl(slide.previewKey)}
            alt={`Slide ${slide.order}: ${slide.title}`}
            loading="lazy"
            className="aspect-video w-full object-cover"
          />
          <figcaption className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
            Slide {slide.order} · {slide.title}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
