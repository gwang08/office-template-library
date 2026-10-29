// DOCX OfficeHandler implementation (first concrete handler; pptx lands in
// Phase 05). Implements the generic OfficeHandler seam (copy + file export)
// and adds the docx-specific HTML capabilities used by the documents flow:
// mammoth ingest (underline preserved via styleMap) and docx/html render.
// docx is pinned to EXACTLY 9.15.0 because docx/html is young — the
// export -> re-ingest round-trip spec below is its regression guard.
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Document, Packer } from 'docx';
import { htmlToContent } from 'docx/html';
import mammoth from 'mammoth';
import { resolveStorageKey } from '../storage/storage.paths';
import type { OfficeDocumentContext, OfficeHandler, OfficeKind } from './office-handler.interface';

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@Injectable()
export class DocxHandler implements OfficeHandler {
  readonly kind: OfficeKind = 'docx';

  /** Byte-for-byte copy of the template file; the source is never written to. */
  async createDocumentCopy(templateStorageKey: string, documentStorageKey: string): Promise<void> {
    const source = resolveStorageKey(templateStorageKey);
    const target = resolveStorageKey(documentStorageKey);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }

  /** mammoth -> HTML for the editor. styleMap keeps <u> from being dropped. */
  async extractHtml(documentStorageKey: string): Promise<string> {
    const filePath = resolveStorageKey(documentStorageKey);
    try {
      const result = await mammoth.convertToHtml({ path: filePath }, { styleMap: ['u => u'] });
      return result.value;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to convert docx copy to HTML: ${(error as Error).message}`,
      );
    }
  }

  /** Editor HTML -> DOCX buffer via docx/html (returns Paragraph|Table[]). */
  async renderHtmlToDocx(contentHtml: string): Promise<Buffer> {
    const doc = new Document({ sections: [{ children: htmlToContent(contentHtml) }] });
    return Packer.toBuffer(doc);
  }

  /** Interface seam: writes the exported DOCX to the document's storage key. */
  async exportDocument(
    _context: OfficeDocumentContext,
    content: string,
    documentStorageKey: string,
  ): Promise<void> {
    const buffer = await this.renderHtmlToDocx(content);
    const target = resolveStorageKey(documentStorageKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);
  }
}
