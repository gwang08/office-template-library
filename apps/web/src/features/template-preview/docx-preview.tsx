// DOCX preview branch: fetches mammoth HTML from the API, sanitizes it
// (allowlist scrub — see sanitize-html.ts) and renders it in a styled
// document panel (.docx-preview in preview.css).
import { useEffect, useState } from 'react';
import { getPreviewHtml } from '../../lib/api';
import { ErrorState } from '../../components/state-blocks';
import { sanitizeHtml } from './sanitize-html';

type DocxState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ok'; html: string };

export function DocxPreview({ templateId }: { templateId: string }) {
  const [state, setState] = useState<DocxState>({ phase: 'loading' });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    getPreviewHtml(templateId)
      .then((body) => {
        if (cancelled) return;
        // Sanitized (allowlist + scheme check) before injection; source is our
        // own seed files — this is the one justified dangerouslySetInnerHTML.
        setState({ phase: 'ok', html: sanitizeHtml(body.html) });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setState({
          phase: 'error',
          message: cause instanceof Error ? cause.message : 'Preview failed to load',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [templateId, retryToken]);

  if (state.phase === 'loading') {
    return (
      <div className="flex items-center justify-center gap-3 py-16" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-sm text-slate-500">Rendering document…</p>
      </div>
    );
  }
  if (state.phase === 'error') {
    return <ErrorState compact message={state.message} onRetry={() => setRetryToken((t) => t + 1)} />;
  }
  return (
    <div className="docx-preview rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      {/* Sanitized server payload — see comment above. */}
      <div dangerouslySetInnerHTML={{ __html: state.html }} />
    </div>
  );
}
