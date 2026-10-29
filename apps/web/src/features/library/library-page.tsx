// Library page ("/"): filter bar (debounced search + kind tabs + category
// chips) feeding useTemplates, responsive card grid with skeleton/error/empty
// states, and the preview modal at page level. "Use template" emits onUse —
// the editor route arrives in Phase 04.
import { useCallback, useEffect, useState } from 'react';
import { CategoryChips } from '../../components/category-chips';
import { KindTabs, type KindFilter } from '../../components/kind-tabs';
import { SearchBar } from '../../components/search-bar';
import { EmptyState, ErrorState, LoadingGrid } from '../../components/state-blocks';
import { TemplateCard } from '../../components/template-card';
import type { TemplateDto } from '../../lib/types';
import { PreviewModal } from '../template-preview/preview-modal';
import { useTemplates } from './use-templates';

const TOAST_MS = 2800;

export function LibraryPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [kind, setKind] = useState<KindFilter>('all');
  const [selected, setSelected] = useState<TemplateDto | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { templates, loading, error, categories, retry } = useTemplates({
    search: searchQuery.trim() || undefined,
    category,
    kind: kind === 'all' ? undefined : kind,
  });

  // Placeholder until Phase 04 wires the real editor flow.
  const handleUse = useCallback((template: TemplateDto) => {
    setToast(`"${template.name}" editor — coming in the next phase`);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const hasFilters = Boolean(searchQuery.trim() || category !== undefined || kind !== 'all');
  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setCategory(undefined);
    setKind('all');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Office Template Library
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Document and presentation templates, ready to preview and use.
            </p>
          </div>
          {!loading && !error && (
            <p className="text-sm text-slate-400" aria-live="polite">
              {templates.length} {templates.length === 1 ? 'template' : 'templates'}
            </p>
          )}
        </header>

        <section className="mb-6 flex flex-col gap-3" aria-label="Template filters">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onDebouncedChange={setSearchQuery}
            />
            <KindTabs value={kind} onChange={setKind} />
          </div>
          <CategoryChips categories={categories} value={category} onChange={setCategory} />
        </section>

        {error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : loading ? (
          <LoadingGrid />
        ) : templates.length === 0 ? (
          <EmptyState onClear={hasFilters ? clearFilters : undefined} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} onOpen={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PreviewModal
          template={selected}
          onClose={() => setSelected(null)}
          onUse={handleUse}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
