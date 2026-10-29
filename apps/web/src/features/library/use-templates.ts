// Data hook for the library page: fetches on filter change (params are the
// source of truth, held by the page), exposes loading/error/retry, and caches
// the category list from the first unfiltered response.
import { useCallback, useEffect, useRef, useState } from 'react';
import { listTemplates } from '../../lib/api';
import type { TemplateDto, TemplateListParams } from '../../lib/types';

function deriveCategories(templates: TemplateDto[]): string[] {
  return Array.from(new Set(templates.map((template) => template.category))).sort();
}

function isUnfiltered(params: TemplateListParams): boolean {
  return !params.search && !params.category && !params.kind;
}

export function useTemplates(params: TemplateListParams) {
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [retryToken, setRetryToken] = useState(0);
  // Null until the first unfiltered response tells us the real category set.
  const categoriesCache = useRef<string[] | null>(null);

  // String key: stable effect dep even though the params object is rebuilt
  // by the page on every render.
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const current = JSON.parse(paramsKey) as TemplateListParams;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listTemplates(current)
      .then((rows) => {
        if (cancelled) return;
        setTemplates(rows);
        setLoading(false);
        if (isUnfiltered(current)) {
          const unique = deriveCategories(rows);
          categoriesCache.current = unique;
          setCategories(unique);
        } else if (categoriesCache.current === null) {
          // Rare path: first observed response was filtered (e.g. initial load
          // failed, user filtered before retry) — backfill chips once.
          listTemplates({})
            .then((all) => {
              if (cancelled) return;
              const unique = deriveCategories(all);
              categoriesCache.current = unique;
              setCategories(unique);
            })
            .catch(() => undefined); // chips are decorative, never block the UI
        }
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : 'Failed to load templates');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, retryToken]);

  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  return { templates, loading, error, categories, retry };
}
