// Category filter chips ("All" + one per category derived from data).
export function CategoryChips({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string | undefined;
  onChange: (category: string | undefined) => void;
}) {
  const chips: (string | undefined)[] = [undefined, ...categories];
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
      {chips.map((category) => {
        const active = value === category;
        const label = category ?? 'All';
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            // Clicking the active category chip clears the filter.
            onClick={() => onChange(active && category !== undefined ? undefined : category)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              active
                ? 'bg-indigo-600 text-white ring-indigo-600'
                : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
