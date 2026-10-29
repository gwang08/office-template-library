// Controlled search input with a 300ms debounce: the parent owns the raw text
// (so "clear filters" can reset it), we only emit the settled value.
import { useEffect, useRef } from 'react';

const DEBOUNCE_MS = 300;

export function SearchBar({
  value,
  onChange,
  onDebouncedChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onDebouncedChange: (value: string) => void;
}) {
  // Ref keeps the timer effect stable while the callback identity changes.
  const emitRef = useRef(onDebouncedChange);
  emitRef.current = onDebouncedChange;

  useEffect(() => {
    const timer = setTimeout(() => emitRef.current(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative w-full sm:max-w-sm">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="2" />
        <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        maxLength={120}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search templates…"
        aria-label="Search templates"
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}
