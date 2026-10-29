import { useEffect, useState } from 'react';
import { get } from '../lib/api';

interface HealthResponse {
  status: string;
}

type HealthState =
  | { state: 'loading' }
  | { state: 'ok'; status: string }
  | { state: 'error'; message: string };

export function HomePage() {
  const [health, setHealth] = useState<HealthState>({ state: 'loading' });

  useEffect(() => {
    let cancelled = false;
    get<HealthResponse>('/api/health')
      .then((body) => {
        if (!cancelled) setHealth({ state: 'ok', status: body.status });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (!cancelled) setHealth({ state: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Office Template Library</h1>
      <p className="text-slate-500">Template library scaffold — web shell online.</p>
      {health.state === 'loading' && <p className="text-slate-400">Checking API health…</p>}
      {health.state === 'ok' && (
        <p className="rounded-full bg-emerald-100 px-4 py-2 font-medium text-emerald-800">
          API status: {health.status}
        </p>
      )}
      {health.state === 'error' && (
        <p className="rounded-full bg-red-100 px-4 py-2 font-medium text-red-700">
          API unreachable: {health.message}
        </p>
      )}
    </main>
  );
}
