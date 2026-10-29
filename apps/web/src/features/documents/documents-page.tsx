// Route /documents — all documents created from templates (newest first).
// The open action routes by kind (Phase 05b): DOCX rows go to the Tiptap
// editor, PPTX rows to the slides page; Download works for both kinds —
// the export endpoint is kind-agnostic.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../../components/state-blocks';
import { exportUrl, listDocuments, type DocumentListItemDto } from '../../lib/api';

type ListState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ok'; documents: DocumentListItemDto[] };

export function DocumentsPage() {
  const [state, setState] = useState<ListState>({ phase: 'loading' });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    listDocuments()
      .then((documents) => {
        if (!cancelled) setState({ phase: 'ok', documents });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setState({
          phase: 'error',
          message: cause instanceof Error ? cause.message : 'Failed to load documents',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My documents
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Copies made from templates — edit and export without touching the originals.
            </p>
          </div>
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Browse templates →
          </Link>
        </header>

        {state.phase === 'loading' ? (
          <Spinner label="Loading documents…" />
        ) : state.phase === 'error' ? (
          <ErrorState message={state.message} onRetry={() => setRetryToken((token) => token + 1)} />
        ) : state.documents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            hint="Pick a template in the library and click “Use template” to create your first copy."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 font-semibold">Title</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Kind</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Template</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Updated</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function DocumentRow({ doc }: { doc: DocumentListItemDto }) {
  const isDocx = doc.kind === 'docx';
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
      <td className="max-w-[22rem] truncate px-4 py-3 font-medium text-slate-900">
        {doc.title}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isDocx ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {doc.kind.toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600">{doc.templateName}</td>
      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
        {new Date(doc.updatedAt).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {isDocx ? (
            <Link
              to={`/documents/${doc.id}/edit`}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Open editor
            </Link>
          ) : (
            <Link
              to={`/documents/${doc.id}`}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            >
              Open slides
            </Link>
          )}
          <a
            href={exportUrl(doc.id)}
            download
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Download
          </a>
        </div>
      </td>
    </tr>
  );
}
