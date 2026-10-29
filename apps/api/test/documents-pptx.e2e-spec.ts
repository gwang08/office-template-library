// E2E: /api/documents pptx flow — file-based copy-on-use. The copy IS the
// source of truth: export streams the copy byte-for-byte, contentHtml is
// null, and template immutability holds through create+export (matrix 10/13).
import { existsSync, readFileSync } from 'node:fs';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import {
  checksumFile,
  createE2eApp,
  deleteTestDb,
  documentFilePath,
  getBinary,
  removeDocumentFiles,
  resetDatabase,
  templateFilePath,
  templateIdByFile,
} from './test-utils';

const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

describe('Documents pptx flow (e2e)', () => {
  let app: INestApplication;
  let pitchId: string;
  let templateAbs: string;
  let templateChecksumBefore: string;
  let docId: string;
  const created: { id: string; kind: string }[] = [];

  beforeAll(async () => {
    resetDatabase();
    app = await createE2eApp();
    pitchId = templateIdByFile('business-pitch.pptx');
    templateAbs = templateFilePath('business-pitch.pptx');
    templateChecksumBefore = await checksumFile(templateAbs);
  });

  afterAll(async () => {
    await app.close();
    removeDocumentFiles(created);
    deleteTestDb();
  });

  it('POST /api/documents copies the pptx template (contentHtml null — file-based)', () =>
    request(app.getHttpServer())
      .post('/api/documents')
      .send({ templateId: pitchId })
      .expect(201)
      .expect((res) => {
        docId = res.body.id;
        created.push({ id: docId, kind: 'pptx' });
        expect(res.body.kind).toBe('pptx');
        expect(res.body.title).toBe('Business Pitch');
        expect(res.body.contentHtml).toBeNull();
        const copy = documentFilePath(docId, 'pptx');
        expect(existsSync(copy)).toBe(true);
        expect(readFileSync(copy).equals(readFileSync(templateAbs))).toBe(true);
      }));

  it('GET /api/documents lists the pptx document with its template name', () =>
    request(app.getHttpServer())
      .get('/api/documents')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toEqual(
          expect.objectContaining({ id: docId, kind: 'pptx', templateName: 'Business Pitch' }),
        );
      }));

  it('PATCH contentHtml on a pptx document is rejected with 400', () =>
    request(app.getHttpServer())
      .patch(`/api/documents/${docId}`)
      .send({ contentHtml: '<p>no html editing for pptx</p>' })
      .expect(400)
      .expect((res) => expect(res.body.message).toMatch(/docx/)));

  it('export streams the stored copy: pptx mime, attachment, bytes equal the copy', async () => {
    const res = await getBinary(app.getHttpServer(), `/api/documents/${docId}/export`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe(PPTX_MIME);
    expect(res.headers['content-disposition']).toBe('attachment; filename="business-pitch.pptx"');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    // Exported bytes == the document copy == the pristine template bytes.
    const copyBytes = readFileSync(documentFilePath(docId, 'pptx'));
    expect(res.body.equals(copyBytes)).toBe(true);
    expect(res.body.equals(readFileSync(templateAbs))).toBe(true);
  });

  it('TEMPLATE IMMUTABILITY: pptx template checksum unchanged after copy+export', async () => {
    expect(await checksumFile(templateAbs)).toBe(templateChecksumBefore);
  });
});
