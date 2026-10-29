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

export interface OfficeHandler {
  readonly kind: OfficeKind;

  /**
   * Copies the template file to the document's storage key (the starting
   * point for PPTX documents, which are edited as files, not as HTML).
   */
  createDocumentCopy(templateStorageKey: string, documentStorageKey: string): Promise<void>;

  /**
   * Exports source content (HTML for docx editors) into an office file at
   * documentStorageKey. Returns the canonical content for storage.
   */
  exportDocument(context: OfficeDocumentContext, content: string, documentStorageKey: string): Promise<void>;
}
