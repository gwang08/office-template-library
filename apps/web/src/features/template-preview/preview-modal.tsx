// Template preview modal: fetches the detail DTO, branches by kind —
// DOCX → sanitized mammoth HTML, PPTX → live deck w/ SVG fallback — and
// exposes "Use template" via the onUse prop (wired to the editor in Phase 04).
import { useEffect, useState } from 'react';
import { Modal } from '../../components/modal';
import { ErrorState } from '../../components/state-blocks';
import { getTemplate } from '../../lib/api';
import type { TemplateDetailDto, TemplateDto } from '../../lib/types';
import { DocxPreview } from './docx-preview';
import { PptxPreview } from './pptx-preview';

type DetailState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ok'; detail: TemplateDetailDto };

export function PreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: TemplateDto;
  onClose: () => void;
  /** Phase 04/05 wire this to POST /api/documents + editor route. */
  onUse: (template: TemplateDto) => void;
}) {
  const [detailState, setDetailState] = useState<DetailState>({ phase: 'loading' });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDetailState({ phase: 'loading' });
    getTemplate(template.id)
      .then((detail) => {
        if (!cancelled) setDetailState({ phase: 'ok', detail });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setDetailState({
          phase: 'error',
          message: cause instanceof Error ? cause.message : 'Failed to load template detail',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [template.id, retryToken]);

  return (
    <Modal title={template.name} onClose={onClose} footer={
      <div className="flex flex-wrap items-center justify-end gap-2">
        <a
          href={`/api/templates/${encodeURIComponent(template.id)}/file`}
          download
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Download file
        </a>
        <button
          type="button"
          onClick={() => onUse(template)}
          title="Editor arrives in the next phase"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Use template
        </button>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {template.category}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {template.kind.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-slate-600">{template.description}</p>
        </div>

        {template.kind === 'docx' ? (
          <DocxPreview templateId={template.id} />
        ) : detailState.phase === 'ok' ? (
          <PptxPreview template={detailState.detail} />
        ) : detailState.phase === 'loading' ? (
          <div className="flex items-center justify-center gap-3 py-16" role="status" aria-live="polite">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <p className="text-sm text-slate-500">Loading template…</p>
          </div>
        ) : (
          <ErrorState
            compact
            message={detailState.message}
            onRetry={() => setRetryToken((token) => token + 1)}
          />
        )}
      </div>
    </Modal>
  );
}
