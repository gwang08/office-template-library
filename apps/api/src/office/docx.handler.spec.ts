// DocxHandler spec — real files in a tmpdir (resolveStorageKey is spied to
// redirect the storage root), no DB. The renderHtmlToDocx -> extractHtml
// round-trip is the regression guard for the young docx/html parser.
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import * as storagePaths from '../storage/storage.paths';
import { DocxHandler } from './docx.handler';

// Redirect every storage key into a per-run tmpdir (ts-jest compiles to CJS,
// so spying on the module export intercepts the handler's calls).
let root: string;
beforeAll(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'docx-handler-spec-'));
  jest
    .spyOn(storagePaths, 'resolveStorageKey')
    .mockImplementation((key: string) => path.join(root, key));
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

const handler = new DocxHandler();

/** Real DOCX fixture: H1 + bold + underlined runs (built with the docx lib). */
async function writeFixture(key: string): Promise<void> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: 'Fixture Heading', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            children: [
              new TextRun('plain '),
              new TextRun({ text: 'bold', bold: true }),
              new TextRun({ text: ' underlined', underline: {} }),
            ],
          }),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  const target = path.join(root, key);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, buffer);
}

describe('DocxHandler.createDocumentCopy', () => {
  it('copies the template byte-for-byte into a nested target dir', async () => {
    await writeFixture('templates/fixture.docx');
    const before = readFileSync(path.join(root, 'templates/fixture.docx'));

    await handler.createDocumentCopy('templates/fixture.docx', 'documents/copy-1.docx');

    const copy = readFileSync(path.join(root, 'documents/copy-1.docx'));
    expect(copy.equals(before)).toBe(true);
    expect(readFileSync(path.join(root, 'templates/fixture.docx')).equals(before)).toBe(true);
  });
});

describe('DocxHandler.extractHtml (mammoth)', () => {
  it('produces h1 + strong + u markup (styleMap keeps underline)', async () => {
    await writeFixture('documents/extract-me.docx');
    const html = await handler.extractHtml('documents/extract-me.docx');
    expect(html).toContain('<h1>Fixture Heading</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<u>');
  });

  it('wraps mammoth failures in InternalServerErrorException', async () => {
    await expect(handler.extractHtml('documents/missing.docx')).rejects.toThrow(
      'Failed to convert docx copy to HTML',
    );
  });
});

describe('DocxHandler.renderHtmlToDocx (docx/html)', () => {
  const sample = '<h1>Title</h1><p>Hello <strong>world</strong> <u>u</u></p><ul><li>a</li><li>b</li></ul>';

  it('returns a non-empty OOXML (zip) buffer', async () => {
    const buffer = await handler.renderHtmlToDocx(sample);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('round-trips: exported file re-ingests via mammoth with heading + bold', async () => {
    const buffer = await handler.renderHtmlToDocx(sample);
    writeFileSync(path.join(root, 'documents/roundtrip.docx'), buffer);
    const html = await handler.extractHtml('documents/roundtrip.docx');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('<u>');
  });
});

describe('DocxHandler.exportDocument (interface seam)', () => {
  it('writes the rendered DOCX to the storage key', async () => {
    await handler.exportDocument(
      { templateId: 't', documentId: 'd', title: 'T' },
      '<p>exported</p>',
      'documents/exported.docx',
    );
    const target = path.join(root, 'documents/exported.docx');
    expect(existsSync(target)).toBe(true);
    expect(readFileSync(target).subarray(0, 2).toString('latin1')).toBe('PK');
  });
});
