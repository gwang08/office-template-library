import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

// Isolated SQLite file for e2e — must be set BEFORE the app module is imported
// (dynamic import below), because ConfigModule loads .env at import time.
process.env.DATABASE_URL = 'file:./test-e2e.db';

describe('Health (e2e)', () => {
  let app: INestApplication;
  const testDbPath = path.resolve(__dirname, '../prisma/test-e2e.db');

  beforeAll(async () => {
    // ServeStatic root must exist or the module warns about the missing directory
    mkdirSync(path.resolve(__dirname, '../../../storage/assets'), { recursive: true });

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    // Mirror the production wiring from main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    rmSync(testDbPath, { force: true });
    rmSync(`${testDbPath}-journal`, { force: true });
  });

  it('GET /api/health returns { status: "ok" }', () =>
    request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({ status: 'ok' }));

  it('GET /api/unknown returns a real 404 (static fallback must not swallow it)', () =>
    request(app.getHttpServer())
      .get('/api/unknown')
      .expect(404));
});
