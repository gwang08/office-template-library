// E2E: /api/health — liveness + DB wiring proof through the real HTTP stack.
// Rewritten in phase 06 onto the shared e2e infra (storage/test.db via
// setup-e2e.ts, prod wiring via createE2eApp).
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { createE2eApp, deleteTestDb, resetDatabase } from './test-utils';

jest.setTimeout(60_000);

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // health performs a raw SELECT 1, so the test db must exist and migrate.
    resetDatabase();
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
    deleteTestDb();
  });

  it('GET /api/health returns { status: "ok" }', () =>
    request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({ status: 'ok' }));

  it('GET /api/unknown returns a real 404 (static fallback must not swallow it)', () =>
    request(app.getHttpServer()).get('/api/unknown').expect(404));
});
