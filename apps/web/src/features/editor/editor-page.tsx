// Route /documents/:id/edit — loads the document detail (404-aware) and
// hands off to the keyed workspace (a fresh editor per document id, so
// switching documents never reuses stale editor state). PPTX documents have
// no in-browser editor: the kind guard redirects them to their slides page
// (the note there explains the download-and-edit model).
import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ErrorState, Spinner } from '../../components/state-blocks';
import { ApiError, getDocument, type DocumentDetailDto } from '../../lib/api';
import { EditorWorkspace } from './editor-workspace';

type DocState =
  | { phase: 'loading' }
  | { phase: 'error'; notFound: boolean; message: string }
  | { phase: 'ok'; doc: DocumentDetailDto };

export function EditorPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<DocState>({ phase: 'loading' });
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

  if (state.phase === 'loading') {
    return (
      <EditorShell>
        <Spinner label="Loading document…" />
      </EditorShell>
    );
  }

  if (state.phase === 'error') {
    return (
      <EditorShell>
        <ErrorState
          message={
            state.notFound
              ? `Document ${id || '(unknown)'} was not found — it may have been deleted.`
              : state.message
          }
          onRetry={() => setRetryToken((token) => token + 1)}
        />
      </EditorShell>
    );
  }

  // Kind guard: a pptx document has no editor — its workspace is the
  // document page (slide previews + download), which carries the notice.
  if (state.doc.kind === 'pptx') {
    return <Navigate to={`/documents/${state.doc.id}`} replace />;
  }

  return <EditorWorkspace key={state.doc.id} doc={state.doc} />;
}

function EditorShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/documents"
          className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          ← My documents
        </Link>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
