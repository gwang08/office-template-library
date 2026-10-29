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

// --- Phase 04 additions (documents: copy-on-use + editor) ------------------

import type { TemplateKind } from './types';

/** Row of GET /api/documents (list) — mirrors DocumentListItem (API). */
export interface DocumentListItemDto {
  id: string;
  title: string;
  kind: TemplateKind | string;
  templateName: string;
  /** ISO timestamp. */
  updatedAt: string;
}

/** GET /api/documents/:id (detail) — includes the editor content. */
export interface DocumentDetailDto extends DocumentListItemDto {
  contentHtml: string | null;
  /** ISO timestamp. */
  createdAt: string;
}

/** PATCH /api/documents/:id body — present fields only (partial update). */
export interface UpdateDocumentParams {
  title?: string;
  contentHtml?: string;
}

/** Minimal typed send wrapper for the mutating document calls. */
async function send<T>(path: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

/** POST /api/documents — copy-on-use from a template; 201 DocumentDto back. */
export function createDocument(templateId: string): Promise<DocumentDetailDto> {
  return send<DocumentDetailDto>('/api/documents', 'POST', { templateId });
}

/** GET /api/documents — all documents, newest first. */
export function listDocuments(): Promise<DocumentListItemDto[]> {
  return get<DocumentListItemDto[]>('/api/documents');
}

/** GET /api/documents/:id — detail incl. contentHtml. */
export function getDocument(id: string): Promise<DocumentDetailDto> {
  return get<DocumentDetailDto>(`/api/documents/${encodeURIComponent(id)}`);
}

/** PATCH /api/documents/:id — partial update (title-only must not clobber content). */
export function patchDocument(id: string, params: UpdateDocumentParams): Promise<DocumentDetailDto> {
  return send<DocumentDetailDto>(`/api/documents/${encodeURIComponent(id)}`, 'PATCH', params);
}

/** Export download URL — the endpoint sets the attachment disposition. */
export function exportUrl(id: string): string {
  return `/api/documents/${encodeURIComponent(id)}/export`;
}
