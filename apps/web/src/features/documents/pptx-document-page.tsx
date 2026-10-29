// Route /documents/:id — PPTX document workspace (Phase 05b). A pptx document
// is an independent byte-for-byte copy of its template: this page shows the
// document title, the template's committed slide SVG previews, Download .pptx
// (the export endpoint streams the copy) and the editing-model note.
// In-browser slide editing is out of scope — documented future path
// (DELIVERY.md). DOCX documents never land here (they Navigate to their
// editor, mirroring the pptx guard on the editor route).
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ErrorState, Spinner } from '../../components/state-blocks';
import {
  ApiError,
  exportUrl,
  getDocument,
  getTemplate,
  listTemplates,
  type DocumentDetailDto,
} from '../../lib/api';
import type { TemplateDetailDto } from '../../lib/types';
import { SlideStrip, type SlidesState } from './pptx-slide-strip';

type DocState =
  | { phase: 'loading' }
  | { phase: 'error'; notFound: boolean; message: string }
  | { phase: 'ok'; doc: DocumentDetailDto };

/**
 * The Phase 04 document DTO carries `templateName` (no templateId — that
 * contract is frozen), so slide previews resolve through the templates API:
 * exact (name, kind) match — unique across the seeded catalog and stable
 * (no template rename/delete endpoint exists). Null when unresolvable: the
 * page degrades to a notice; Download keeps working because the copy itself
 * never touches the template.
 */
async function resolveTemplate(doc: DocumentDetailDto): Promise<TemplateDetailDto | null> {
  const candidates = await listTemplates({ kind: 'pptx', search: doc.templateName });
  const match = candidates.find((candidate) => candidate.name === doc.templateName);
  return match ? getTemplate(match.id) : null;
}

export function PptxDocumentPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<DocState>({ phase: 'loading' });
  const [slides, setSlides] = useState<SlidesState>({ phase: 'loading' });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    getDocument(id)
      .then((doc) => {
        if (!cancelled) setState({ phase: 'ok', doc });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setState({
          phase: 'error',
          notFound: cause instanceof ApiError && cause.status === 404,
          message: cause instanceof Error ? cause.message : 'Failed to load document',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, retryToken]);

  useEffect(() => {
    if (state.phase !== 'ok' || state.doc.kind !== 'pptx') return;
    let cancelled = false;
    setSlides({ phase: 'loading' });
    resolveTemplate(state.doc)
      .then((template) => {
        if (cancelled) return;
        setSlides(
          template
            ? { phase: 'ok', template }
            : { phase: 'unavailable', reason: 'its template could not be matched' },
        );
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setSlides({
          phase: 'unavailable',
          reason: cause instanceof Error ? cause.message : 'template lookup failed',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [state]);

  if (state.phase === 'ok' && state.doc.kind !== 'pptx') {
    // DOCX documents live in the Tiptap editor — symmetric with the pptx
    // guard on /documents/:id/edit.
    return <Navigate to={`/documents/${state.doc.id}/edit`} replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/documents"
          className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          ← My documents
        </Link>
        <div className="mt-6">
          {state.phase === 'loading' ? (
            <Spinner label="Loading document…" />
          ) : state.phase === 'error' ? (
            <ErrorState
              message={
                state.notFound
                  ? `Document ${id || '(unknown)'} was not found — it may have been deleted.`
                  : state.message
              }
              onRetry={() => setRetryToken((token) => token + 1)}
            />
          ) : (
            <DocumentBody doc={state.doc} slides={slides} />
          )}
        </div>
      </div>
    </main>
  );
}

function DocumentBody({ doc, slides }: { doc: DocumentDetailDto; slides: SlidesState }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              PPTX
            </span>
            <span className="text-xs text-slate-500">
              from template: <span className="font-medium text-slate-600">{doc.templateName}</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {doc.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Updated {new Date(doc.updatedAt).toLocaleString()}
          </p>
        </div>
        <a
          href={exportUrl(doc.id)}
          download
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Download .pptx
        </a>
      </header>

      <p
        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        aria-label="How this copy works"
      >
        This is an <strong>independent copy</strong> — the template stays untouched. Editing
        happens in your presentation app (PowerPoint, Keynote, Google Slides): download the .pptx
        and make your changes there. In-browser slide editing is a documented future path.
      </p>

      <section aria-label="Slide previews">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Slides</h2>
        <SlideStrip slides={slides} />
      </section>
    </div>
  );
}
