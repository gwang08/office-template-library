// Shared async-state blocks (DRY): skeleton grid, error banner w/ retry,
// empty state w/ optional clear-filters action. Used by library + previews.

/** Skeleton shimmer grid shown while the template list loads. */
export function LoadingGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading templates"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="aspect-video animate-pulse bg-slate-200" />
          <div className="space-y-2.5 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Error banner with a retry button — never a blank screen on API failure. */
export function ErrorState({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 text-center ${
        compact ? 'p-6' : 'p-10'
      }`}
      role="alert"
    >
      <p className="font-medium text-red-800">Something went wrong</p>
      <p className="max-w-md text-sm text-red-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Try again
      </button>
    </div>
  );
}

/** Empty result state — offers a clear-filters action when filters are active. */
export function EmptyState({
  title = 'No templates match',
  hint = 'Try a different search term or clear the active filters.',
  onClear,
  clearLabel = 'Clear filters',
}: {
  title?: string;
  hint?: string;
  onClear?: () => void;
  clearLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white/60 p-10 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      <p className="max-w-md text-sm text-slate-500">{hint}</p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}

/** Small inline spinner with label — used inside the preview modal. */
export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
