// Document-type strategy seam. Every office kind (today: docx, pptx) gets one
// OfficeHandler implementation. Phases 04/05 register the concrete handlers;
// adding a new document type later (e.g. xlsx) means implementing this
// interface and registering it — zero controller changes.

export type OfficeKind = 'docx' | 'pptx';

/** Minimal metadata the editor flow (Phase 04/05) works with. */
export interface OfficeDocumentContext {
  templateId: string;
  documentId: string;
  title: string;
}

/** What GET /api/documents/:id/export streams (built by the handler). */
export interface OfficeExportPayload {
  buffer: Buffer;
  /** OOXML mime for the kind (e.g. presentationml for pptx). */
  mime: string;
  /** Header-safe ascii slug of the title + kind extension. */
  filename: string;
}

export interface OfficeHandler {
  readonly kind: OfficeKind;

  /**
   * Copies the template file to the document's storage key (the starting
   * point for PPTX documents, which are edited as files, not as HTML).
   */
  createDocumentCopy(templateStorageKey: string, documentStorageKey: string): Promise<void>;

  /**
   * Builds the export file for the kind: docx renders `content` (editor
   * HTML) into a fresh DOCX; pptx streams the stored copy. `content` is
   * null for kinds whose source of truth is the file itself (pptx).
   */
  exportDocument(
    context: OfficeDocumentContext,
    content: string | null,
    documentStorageKey: string,
  ): Promise<OfficeExportPayload>;
}
