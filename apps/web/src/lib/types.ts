// Shared web-side DTO types — mirrors the Phase 02 API response shapes
// (apps/api/src/templates/templates.service.ts). Single source for the UI.

export type TemplateKind = 'docx' | 'pptx';

/** Row of GET /api/templates (list). */
export interface TemplateDto {
  id: string;
  name: string;
  description: string;
  category: string;
  kind: TemplateKind;
  /** Storage key like "assets/thumbs/<slug>/card.svg" — served under /assets. */
  thumbnailKey: string;
  slideCount: number;
}

/** Slide entry of GET /api/templates/:id (detail). */
export interface TemplateSlideDto {
  order: number;
  title: string;
  previewKey: string;
}

/** GET /api/templates/:id (detail). */
export interface TemplateDetailDto {
  id: string;
  name: string;
  description: string;
  category: string;
  kind: TemplateKind;
  thumbnailKey: string;
  slides: TemplateSlideDto[];
}

/** Query params for GET /api/templates — all optional (undefined = unfiltered). */
export interface TemplateListParams {
  search?: string;
  category?: string;
  kind?: TemplateKind;
}

/** GET /api/templates/:id/preview (docx only) — mammoth HTML + converter messages. */
export interface PreviewHtmlDto {
  html: string;
  messages: string[];
}
