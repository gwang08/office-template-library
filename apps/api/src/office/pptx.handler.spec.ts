// PptxHandler spec — real files in a tmpdir (resolveStorageKey is spied to
// redirect the storage root), no DB. Pins the two guarantees of the pptx
// flow: the copy is byte-for-byte (template never written to, two copies
// from one template are independent) and export streams the stored copy
// with the pptx OOXML mime + slug filename. The handler never parses the
// file, so the fixture is a zip-shaped blob, not a real presentation.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as storagePaths from '../storage/storage.paths';
import { PPTX_MIME, PptxHandler, slugifyPptxFilename } from './pptx.handler';

let root: string;
beforeAll(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'pptx-handler-spec-'));
  jest
    .spyOn(storagePaths, 'resolveStorageKey')
    .mockImplementation((key: string) => path.join(root, key));
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

const handler = new PptxHandler();

/** Fake "pptx": any distinct byte blob — the handler only copies/reads it. */
function writeFixture(key: string, marker: string): void {
  const target = path.join(root, key);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, Buffer.from(`PK\x03\x04${marker}`));
}

describe('PptxHandler.createDocumentCopy', () => {
  it('copies the template byte-for-byte; two copies are independent files', async () => {
    writeFixture('templates/deck.pptx', 'template-bytes');
    const before = readFileSync(path.join(root, 'templates/deck.pptx'));

    await handler.createDocumentCopy('templates/deck.pptx', 'documents/copy-1.pptx');
    await handler.createDocumentCopy('templates/deck.pptx', 'documents/copy-2.pptx');

    const copy1 = readFileSync(path.join(root, 'documents/copy-1.pptx'));
    const copy2 = readFileSync(path.join(root, 'documents/copy-2.pptx'));
    expect(copy1.equals(before)).toBe(true);
    expect(copy2.equals(before)).toBe(true);
    // Independent files: overwriting one copy leaves the other untouched.
    writeFileSync(path.join(root, 'documents/copy-1.pptx'), Buffer.from('PK\x03\x04edited'));
    expect(readFileSync(path.join(root, 'documents/copy-2.pptx')).equals(before)).toBe(true);
    // The template is never written to.
    expect(readFileSync(path.join(root, 'templates/deck.pptx')).equals(before)).toBe(true);
  });

  it('propagates copy failures (missing template)', async () => {
    await expect(
      handler.createDocumentCopy('templates/missing.pptx', 'documents/copy-x.pptx'),
    ).rejects.toThrow();
    expect(existsSync(path.join(root, 'documents/copy-x.pptx'))).toBe(false);
  });
});

describe('PptxHandler.exportDocument', () => {
  it('streams the stored copy with pptx mime and a slug filename', async () => {
    writeFixture('documents/deck-doc.pptx', 'stored-copy-bytes');
    const payload = await handler.exportDocument(
      { templateId: 't-1', documentId: 'd-1', title: 'Q3 Pitch — final!' },
      null,
      'documents/deck-doc.pptx',
    );
    expect(payload.buffer.equals(readFileSync(path.join(root, 'documents/deck-doc.pptx')))).toBe(
      true,
    );
    expect(payload.mime).toBe(PPTX_MIME);
    expect(payload.filename).toBe('q3-pitch-final.pptx');
  });

  it('wraps read failures in InternalServerErrorException', async () => {
    await expect(
      handler.exportDocument(
        { templateId: 't-1', documentId: 'd-1', title: 'x' },
        null,
        'documents/missing.pptx',
      ),
    ).rejects.toThrow('Failed to read pptx copy for export');
  });
});

describe('slugifyPptxFilename', () => {
  it('reuses the export-filename policy with the pptx extension', () => {
    expect(slugifyPptxFilename('Q3 Business Pitch')).toBe('q3-business-pitch.pptx');
    expect(slugifyPptxFilename('report\r\nSet-Cookie: pwned')).toBe(
      'report-set-cookie-pwned.pptx',
    );
    expect(slugifyPptxFilename('')).toBe('document.pptx');
    expect(slugifyPptxFilename('日本語')).toBe('document.pptx');
  });
});
