// PPTX OfficeHandler implementation — handler #2, the extensibility proof:
// this file (plus its registration in OfficeModule) is ALL that "support
// PowerPoint" cost the backend. PowerPoint documents are file-based: the
// copy IS the source of truth (no HTML conversion — contentHtml is null),
// and export streams that copy back so the user edits in their
// presentation app. In-browser slide editing is a documented future path
// (OnlyOffice/Collabora — see plan Phase 05/07), not implemented here.
import { readFile } from 'node:fs/promises';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { resolveStorageKey } from '../storage/storage.paths';
import { slugifyDocxFilename } from '../documents/export-filename';
import { copyStoredFile } from './copy-stored-file';
import type {
  OfficeDocumentContext,
  OfficeExportPayload,
  OfficeHandler,
  OfficeKind,
} from './office-handler.interface';

export const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

/**
 * "Q3 Pitch — final!" -> "q3-pitch-final.pptx" (ascii slug, never empty).
 * Reuses the documents export-filename policy (header-injection safe) and
 * swaps the extension — same guarantees as the docx slug.
 */
export const slugifyPptxFilename = (title: string): string =>
  slugifyDocxFilename(title).replace(/\.docx$/, '.pptx');

@Injectable()
export class PptxHandler implements OfficeHandler {
  readonly kind: OfficeKind = 'pptx';

  /** Byte-for-byte copy of the template file; the source is never written to. */
  async createDocumentCopy(templateStorageKey: string, documentStorageKey: string): Promise<void> {
    await copyStoredFile(templateStorageKey, documentStorageKey);
  }

  /** Interface seam: streams the stored copy — no rendering, no conversion. */
  async exportDocument(
    context: OfficeDocumentContext,
    _content: string | null,
    documentStorageKey: string,
  ): Promise<OfficeExportPayload> {
    try {
      const buffer = await readFile(resolveStorageKey(documentStorageKey));
      return { buffer, mime: PPTX_MIME, filename: slugifyPptxFilename(context.title) };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to read pptx copy for export: ${(error as Error).message}`,
      );
    }
  }
}
