/** Error thrown for non-2xx API responses. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Minimal typed fetch wrapper — no axios (YAGNI). */
export async function get<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new ApiError(response.status, `GET ${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

// --- Phase 03 additions (template library) ---------------------------------

import type {
  PreviewHtmlDto,
  TemplateDetailDto,
  TemplateDto,
  TemplateListParams,
} from './types';

/** GET /api/templates — list with optional search/category/kind filters. */
export async function listTemplates(params: TemplateListParams = {}): Promise<TemplateDto[]> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.kind) query.set('kind', params.kind);
  const qs = query.toString();
  return get<TemplateDto[]>(`/api/templates${qs ? `?${qs}` : ''}`);
}

/** GET /api/templates/:id — detail incl. slide previews (pptx fallback). */
export async function getTemplate(id: string): Promise<TemplateDetailDto> {
  return get<TemplateDetailDto>(`/api/templates/${encodeURIComponent(id)}`);
}

/** GET /api/templates/:id/preview — mammoth HTML for docx templates. */
export async function getPreviewHtml(id: string): Promise<PreviewHtmlDto> {
  return get<PreviewHtmlDto>(`/api/templates/${encodeURIComponent(id)}/preview`);
}

/** GET /api/templates/:id/file — binary OOXML payload (pptx live preview). */
export async function getTemplateFile(id: string): Promise<ArrayBuffer> {
  const response = await fetch(`/api/templates/${encodeURIComponent(id)}/file`);
  if (!response.ok) {
    throw new ApiError(response.status, `GET file for template ${id} failed with ${response.status}`);
  }
  return response.arrayBuffer();
}

/** Storage key ("assets/thumbs/x/card.svg") -> servable URL path. */
export function assetUrl(key: string): string {
  return `/${key.replace(/^\/+/, '')}`;
}
