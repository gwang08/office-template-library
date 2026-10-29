// E2E: /api/documents docx flow — copy-on-use creation, TEMPLATE
// IMMUTABILITY (sha256 before/after create+edit+export), partial update,
// export + mammoth round-trip on normalized text (matrix 10-13, docx half).
import { existsSync, readFileSync } from 'node:fs';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import mammoth from 'mammoth';
import {
  checksumFile,
  createE2eApp,
  deleteTestDb,
  documentFilePath,
  getBinary,
  normalizeText,
  removeDocumentFiles,
  resetDatabase,
  templateFilePath,
  templateIdByFile,
} from './test-utils';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';
const EDIT_MARKER = 'zyqx invoice marker 4815162342';

describe('Documents docx flow (e2e)', () => {
  let app: INestApplication;
  let invoiceId: string;
  let templateAbs: string;
  let templateChecksumBefore: string;
  let docId: string;
  const created: { id: string; kind: string }[] = [];

  beforeAll(async () => {
    resetDatabase();
    app = await createE2eApp();
    invoiceId = templateIdByFile('invoice.docx');
    templateAbs = templateFilePath('invoice.docx');
    templateChecksumBefore = await checksumFile(templateAbs);
  });

  afterAll(async () => {
    await app.close();
    removeDocumentFiles(created);
    deleteTestDb();
  });

  it('POST /api/documents copies the invoice template into a separate file', () =>
    request(app.getHttpServer())
      .post('/api/documents')
      .send({ templateId: invoiceId })
      .expect(201)
      .expect('Content-Type', /json/)
      .expect((res) => {
        docId = res.body.id;
        created.push({ id: docId, kind: 'docx' });
        expect(res.body.kind).toBe('docx');
        expect(res.body.title).toBe('Invoice');
        expect(res.body.templateName).toBe('Invoice');
        // contentHtml is REAL mammoth output of the copy, not a placeholder
        expect(res.body.contentHtml).toContain('<h1');
        // The copy lives separately under storage/documents/ ...
        const copy = documentFilePath(docId, 'docx');
        expect(existsSync(copy)).toBe(true);
        // ... and is byte-for-byte the template (copy-on-use)
        expect(readFileSync(copy).equals(readFileSync(templateAbs))).toBe(true);
      }));

  it('GET /api/documents lists the new document', () =>
    request(app.getHttpServer())
      .get('/api/documents')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toEqual(
          expect.objectContaining({ id: docId, kind: 'docx', title: 'Invoice', templateName: 'Invoice' }),
        );
      }));

  it('GET /api/documents/:id returns contentHtml; unknown id -> 404', async () => {
    const detail = await request(app.getHttpServer()).get(`/api/documents/${docId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.contentHtml).toContain('<h1');

    const missing = await request(app.getHttpServer()).get(`/api/documents/${UNKNOWN_UUID}`);
    expect(missing.status).toBe(404);
    expect(missing.body.statusCode).toBe(404);
  });

  it('PATCH edits title+contentHtml (the edit the export must carry)', () =>
    request(app.getHttpServer())
      .patch(`/api/documents/${docId}`)
      .send({
        title: 'Q3 Invoice — final!',
        contentHtml: `<h1>${EDIT_MARKER}</h1><p>Edited <strong>bold</strong> and <u>underlined</u> text</p>`,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.title).toBe('Q3 Invoice — final!');
        expect(res.body.contentHtml).toContain(EDIT_MARKER);
      }));

  it('title-only PATCH preserves contentHtml; junk/oversize/unknown are rejected', async () => {
    const titleOnly = await request(app.getHttpServer())
      .patch(`/api/documents/${docId}`)
      .send({ title: 'Renamed only' });
    expect(titleOnly.status).toBe(200);
    expect(titleOnly.body.title).toBe('Renamed only');
    expect(titleOnly.body.contentHtml).toContain(EDIT_MARKER);

    const junk = await request(app.getHttpServer())
      .patch(`/api/documents/${docId}`)
      .send({ evil: 'x', title: 'nope' });
    expect(junk.status).toBe(400); // forbidNonWhitelisted

    const oversize = await request(app.getHttpServer())
      .patch(`/api/documents/${docId}`)
      .send({ contentHtml: 'a'.repeat(2_000_001) });
    expect(oversize.status).toBe(400); // DTO MaxLength rejects it

    // Beyond the aligned body limit the transport layer (413) takes over —
    // layered DoS caps, both client errors.
    const tooHuge = await request(app.getHttpServer())
      .patch(`/api/documents/${docId}`)
      .send({ contentHtml: 'a'.repeat(3_000_000) });
    expect(tooHuge.status).toBe(413);

    const unknown = await request(app.getHttpServer())
      .patch(`/api/documents/${UNKNOWN_UUID}`)
      .send({ title: 'x' });
    expect(unknown.status).toBe(404);
  });

  it('export returns the edited DOCX as attachment and round-trips via mammoth', async () => {
    // Re-establish the slug-bearing title (a previous test renamed it).
    await request(app.getHttpServer())
      .patch(`/api/documents/${docId}`)
      .send({ title: 'Q3 Invoice — final!' })
      .expect(200);

    const res = await getBinary(app.getHttpServer(), `/api/documents/${docId}/export`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe(DOCX_MIME);
    expect(res.headers['content-disposition']).toBe('attachment; filename="q3-invoice-final.docx"');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.subarray(0, 2).toString('latin1')).toBe('PK'); // OOXML zip

    // Round-trip: the exported file re-ingests and CONTAINS the edited text.
    const roundTrip = await mammoth.convertToHtml({ buffer: res.body }, { styleMap: ['u => u'] });
    const text = normalizeText(roundTrip.value);
    expect(text).toContain(EDIT_MARKER);
    expect(text).toContain('bold');
    expect(text).toContain('underlined');
  });

  it('TEMPLATE IMMUTABILITY: template checksum is unchanged after copy+edit+export', async () => {
    // Also re-check the stored copy still equals the pristine template bytes.
    expect(readFileSync(documentFilePath(docId, 'docx')).equals(readFileSync(templateAbs))).toBe(true);
    expect(await checksumFile(templateAbs)).toBe(templateChecksumBefore);
  });

  it('unknown templateId -> 404; templateId junk -> 400', async () => {
    const missing = await request(app.getHttpServer())
      .post('/api/documents')
      .send({ templateId: UNKNOWN_UUID });
    expect(missing.status).toBe(404);

    const malformed = await request(app.getHttpServer())
      .post('/api/documents')
      .send({ templateId: '../../etc/passwd' });
    expect(malformed.status).toBe(400);
  });
});
