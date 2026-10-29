// E2E: GET /api/templates — list, filters, detail, preview, file streaming
// (test matrix items 6-9) against the real app + seeded test db + real
// template files in storage/templates.
import { existsSync } from 'node:fs';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import {
  createE2eApp,
  deleteTestDb,
  getBinary,
  resetDatabase,
  templateFilePath,
  templateIdByFile,
} from './test-utils';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

describe('Templates (e2e)', () => {
  let app: INestApplication;
  let invoiceId: string;
  let pitchId: string;

  beforeAll(async () => {
    resetDatabase();
    app = await createE2eApp();
    invoiceId = templateIdByFile('invoice.docx');
    pitchId = templateIdByFile('business-pitch.pptx');
  });

  afterAll(async () => {
    await app.close();
    deleteTestDb();
  });

  it('GET /api/templates returns all 9 seeded templates', () =>
    request(app.getHttpServer())
      .get('/api/templates')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(res.body).toHaveLength(9);
        expect(res.body[0]).toEqual(
          expect.objectContaining({ id: expect.any(String), name: expect.any(String), kind: expect.any(String) }),
        );
      }));

  it('kind=pptx returns only the 3 pptx templates', () =>
    request(app.getHttpServer())
      .get('/api/templates?kind=pptx')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(3);
        expect(res.body.every((t: { kind: string }) => t.kind === 'pptx')).toBe(true);
      }));

  it("search='invoice' narrows to the invoice template (case-insensitive)", () =>
    request(app.getHttpServer())
      .get('/api/templates?search=invoice')
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body.some((t: { id: string }) => t.id === invoiceId)).toBe(true);
        expect(
          res.body.every((t: { name: string; description: string }) =>
            `${t.name} ${t.description}`.toLowerCase().includes('invoice'),
          ),
        ).toBe(true);
      }));

  it('kind=docx + category=Finance combines to exactly the invoice template', () =>
    request(app.getHttpServer())
      .get('/api/templates?kind=docx&category=Finance')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(invoiceId);
      }));

  it('invalid kind is rejected with 400 (enum guard at the boundary)', () =>
    request(app.getHttpServer()).get('/api/templates?kind=xls').expect(400));

  it('empty query values are treated as "not provided" (still 9)', () =>
    request(app.getHttpServer())
      .get('/api/templates?kind=&search=')
      .expect(200)
      .expect((res) => expect(res.body).toHaveLength(9)));

  it('GET /api/templates/:id returns docx detail with thumbnail + 0 slides', () =>
    request(app.getHttpServer())
      .get(`/api/templates/${invoiceId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({ id: invoiceId, kind: 'docx', slides: [] }),
        );
        expect(res.body.thumbnailKey).toMatch(/^assets\//);
      }));

  it('GET /api/templates/:id returns pptx detail with ordered slides', () =>
    request(app.getHttpServer())
      .get(`/api/templates/${pitchId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.kind).toBe('pptx');
        expect(res.body.slides).toHaveLength(6);
        // Seed slide order starts at 1 (mirrors the asset generator manifest).
        expect(res.body.slides.map((s: { order: number }) => s.order)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(res.body.slides[0]).toEqual(
          expect.objectContaining({ title: expect.any(String), previewKey: expect.any(String) }),
        );
      }));

  it('unknown uuid -> 404 JSON; malformed id -> 400 (never a 500)', async () => {
    const notFound = await request(app.getHttpServer()).get(`/api/templates/${UNKNOWN_UUID}`);
    expect(notFound.status).toBe(404);
    expect(notFound.body).toEqual(expect.objectContaining({ statusCode: 404, message: expect.any(String) }));

    const malformed = await request(app.getHttpServer()).get('/api/templates/not-a-uuid');
    expect(malformed.status).toBe(400);
    expect(malformed.body.statusCode).toBe(400);
  });

  it('GET /api/templates/:id/preview renders docx HTML with h1 + underline', () =>
    request(app.getHttpServer())
      .get(`/api/templates/${invoiceId}/preview`)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect((res) => {
        expect(typeof res.body.html).toBe('string');
        expect(res.body.html).toContain('<h1');
        expect(res.body.html).toContain('<u>');
        expect(Array.isArray(res.body.messages)).toBe(true);
      }));

  it('preview of a pptx template is rejected with 400', () =>
    request(app.getHttpServer())
      .get(`/api/templates/${pitchId}/preview`)
      .expect(400)
      .expect((res) => expect(res.body.message).toMatch(/docx/)));

  it('GET /api/templates/:id/file streams the OOXML file inline', async () => {
    expect(existsSync(templateFilePath('invoice.docx'))).toBe(true);
    const res = await getBinary(app.getHttpServer(), `/api/templates/${invoiceId}/file`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe(DOCX_MIME);
    expect(res.headers['content-disposition']).toBe('inline; filename="invoice.docx"');
    expect(res.headers['content-type']).not.toBe(PPTX_MIME);
    // OOXML = zip: magic bytes PK
    expect(res.body.subarray(0, 2).toString('latin1')).toBe('PK');
  });
});
