// PPTX preview branch: streams the deck (ArrayBuffer) and renders it live via
// the lazily-imported `pptx-preview` viewer (init/preview/destroy — pulls
// echarts into its own chunk, out of the initial bundle). If the live render
// fails we degrade to the committed per-slide SVG previews + download.
import { useEffect, useRef, useState } from 'react';
import { assetUrl, getTemplateFile } from '../../lib/api';
import { ErrorState } from '../../components/state-blocks';
import type { TemplateDetailDto } from '../../lib/types';

type Phase = 'loading' | 'live' | 'fallback' | 'error';

interface Viewer {
  preview: (buffer: ArrayBuffer) => Promise<unknown>;
  destroy: () => void;
}

export function PptxPreview({ template }: { template: TemplateDetailDto }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState('');
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let viewer: Viewer | null = null;
    setPhase('loading');
    setMessage('');

    getTemplateFile(template.id)
      .then(async (buffer) => {
        if (cancelled) return;
        const host = hostRef.current;
        if (!host) return;
        // Lazy import: pptx-preview (+echarts) stays out of the initial bundle.
        const { init } = await import('pptx-preview');
        if (cancelled) return;
        try {
          // The container MUST be visible here — pptx-preview measures the
          // host while rendering; a display:none host yields an empty deck.
          viewer = init(host, { width: 960, height: 540, mode: 'list' });
          await viewer.preview(buffer);
          if (cancelled) return;
          // pptx-preview swallows internal parse errors (resolves with an
          // empty deck) — treat "no slides rendered" as a render failure.
          const wrapper = host.querySelector('.pptx-preview-wrapper');
          if (!wrapper || wrapper.children.length === 0) {
            throw new Error('viewer rendered no slides');
          }
          setPhase('live');
        } catch (cause) {
          // Viewer choked on this deck — fall back to committed slide SVGs.
          if (!cancelled) {
            setMessage(cause instanceof Error ? cause.message : 'live render failed');
            setPhase('fallback');
          }
        }
      })
      .catch((cause: unknown) => {
        // Network/transport failure (API down, file missing) — real error.
        if (!cancelled) {
          setMessage(cause instanceof Error ? cause.message : 'Could not load the deck');
          setPhase('error');
        }
      });

    return () => {
      cancelled = true;
      viewer?.destroy(); // echarts instances + listeners must be released
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [template.id, retryToken]);

  // Clear any half-rendered viewer DOM when we stop showing the live deck.
  useEffect(() => {
    if (phase === 'fallback' || phase === 'error') {
      if (hostRef.current) hostRef.current.innerHTML = '';
    }
  }, [phase]);

  return (
    <div className="relative">
      {phase === 'loading' && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-2 shadow">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
            <p className="text-sm text-slate-500">Rendering deck…</p>
          </div>
        </div>
      )}
      {phase === 'error' && (
        <ErrorState compact message={message} onRetry={() => setRetryToken((t) => t + 1)} />
      )}
      {phase === 'fallback' && (
        <div className="space-y-4">
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
            Live rendering hit a snag{message ? ` (${message})` : ''} — showing slide previews
            instead. You can still download the .pptx below.
          </p>
          <div className="space-y-3">
            {template.slides.map((slide) => (
              <figure key={slide.order} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img
                  src={assetUrl(slide.previewKey)}
                  alt={`Slide ${slide.order}: ${slide.title}`}
                  loading="lazy"
                  className="w-full"
                />
                <figcaption className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
                  Slide {slide.order} · {slide.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
      {/* Host stays mounted and VISIBLE from the start (init measures it);
          hidden only once we've moved to fallback/error content. */}
      <div
        ref={hostRef}
        className="pptx-host"
        style={{ display: phase === 'fallback' || phase === 'error' ? 'none' : 'block' }}
        aria-label={`${template.name} slide deck`}
        role="region"
      />
    </div>
  );
}
