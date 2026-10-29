// E2E security + hardening: path-traversal matrix (14), rate-limit smoke
// (15), helmet headers, consistent 4xx JSON shape, no stack leaks, and a
// dev.db checksum guard proving test isolation.
//
// THROTTLE_LIMIT is set at MODULE scope so it lands before createE2eApp's
// dynamic AppModule import (the throttler reads it at import time). It is
// removed in afterAll so later suites in the same jest process keep the
// production default (100/min).
process.env.THROTTLE_LIMIT = '30';

import { join } from 'node:path';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { STORAGE_ROOT, checksumFile, createE2eApp, deleteTestDb, resetDatabase } from './test-utils';

jest.setTimeout(60_000);

const DEV_DB = join(STORAGE_ROOT, 'dev.db');

// Encoded traversal payloads (raw ../ would be collapsed by the HTTP client
// itself — %2F/%2e variants survive to the server) + a plain junk id.
const TRAVERSAL_PAYLOADS = [
  '..%2F..%2Fetc%2Fpasswd',
  '..%2F..%2F..%2Fstorage%2Fdev.db',
  '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  'not-a-uuid',
];

const TRAVERSAL_ROUTES = [
  '/api/templates/{id}',
  '/api/templates/{id}/preview',
  '/api/templates/{id}/file',
  '/api/documents/{id}',
  '/api/documents/{id}/export',
];

describe('Security + hardening (e2e)', () => {
  let app: INestApplication;
  let devDbChecksumBefore: string;

  beforeAll(async () => {
    resetDatabase();
    app = await createE2eApp();
    devDbChecksumBefore = await checksumFile(DEV_DB);
  });

  afterAll(async () => {
    await app.close();
    deleteTestDb();
    delete process.env.THROTTLE_LIMIT;
  });

  // 14 — traversal matrix: every encoded variant on every id-bearing route
  // is answered with a client error and a JSON body. Never 200, never 500.
  it.each(TRAVERSAL_ROUTES.flatMap((route) => TRAVERSAL_PAYLOADS.map((payload) => [route, payload])))(
    'traversal %s id=%s -> 400/404 JSON, never 200/500',
    async (route, payload) => {
      const res = await request(app.getHttpServer()).get(route.replace('{id}', payload));
      expect([400, 404]).toContain(res.status);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual(
        expect.objectContaining({ statusCode: res.status, message: expect.anything() }),
      );
    },
  );

  it('dev.db is untouched by the whole suite (checksum identical)', async () => {
    expect(await checksumFile(DEV_DB)).toBe(devDbChecksumBefore);
  });

  it('helmet security headers are present (main.ts wiring mirrored)', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  it('unknown /api route -> consistent 404 JSON shape, no stack trace leaked', async () => {
    const res = await request(app.getHttpServer()).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      statusCode: 404,
      message: 'Cannot GET /api/does-not-exist',
      error: 'Not Found',
    });
    expect(res.body.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/\n\s+at /);
  });

  it('validation errors share the same { statusCode, message, error } shape', async () => {
    const res = await request(app.getHttpServer()).get('/api/templates?kind=xls');
    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.error).toBe('Bad Request');
    expect(Array.isArray(res.body.message)).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/\n\s+at /);
  });

  // 15 — throttle smoke: this suite already made ~26 requests; bursting
  // more must cross THROTTLE_LIMIT=30 and surface 429 with a JSON body.
  it('bursting past THROTTLE_LIMIT yields 429 with a JSON error body', async () => {
    const server = app.getHttpServer();
    let saw429 = false;
    for (let i = 0; i < 60 && !saw429; i++) {
      const res = await request(server).get('/api/health');
      expect([200, 429]).toContain(res.status);
      if (res.status === 429) {
        saw429 = true;
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.body.statusCode).toBe(429);
      }
    }
    expect(saw429).toBe(true);
  });
});
