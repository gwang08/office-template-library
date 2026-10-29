// Shared helpers for the Supertest e2e suites. Every suite: resetDatabase()
// in beforeAll -> createE2eApp() -> assertions -> afterAll cleanup (created
// document files, test db, app). Suites run with --runInBand so the single
// storage/test.db is never contended.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { IncomingMessage, Server } from 'node:http';
import path from 'node:path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { json } from 'express';
import helmet from 'helmet';
import request from 'supertest';
import { TEST_DB_PATH } from './setup-e2e';

export const REPO_ROOT = path.resolve(__dirname, '../../..');
export const STORAGE_ROOT = path.join(REPO_ROOT, 'storage');

/** sha256 of a file on disk — the template-immutability oracle. */
export async function checksumFile(absPath: string): Promise<string> {
  return createHash('sha256').update(await readFile(absPath)).digest('hex');
}

/**
 * Fresh database for a suite: delete, `prisma migrate deploy`, `prisma db seed`.
 * DATABASE_URL is forced onto storage/test.db in the child-process env, which
 * takes precedence over apps/api/.env (dev.db) — verified by the security
 * suite's dev.db-checksum guard. Seed upserts by fixed uuids (idempotent).
 */
export function resetDatabase(): void {
  const env = { ...process.env, DATABASE_URL: `file:${TEST_DB_PATH}` };
  const options = { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' as const, env };
  execSync('pnpm exec prisma migrate deploy', options);
  execSync('pnpm exec prisma db seed', options);
}

/**
 * Boots the real AppModule through the real Nest HTTP stack with EXACTLY the
 * production wiring from main.ts (helmet, /api prefix, ValidationPipe with
 * forbidNonWhitelisted). The AppModule is imported dynamically so env vars
 * set by setup-e2e / the spec (e.g. THROTTLE_LIMIT) are read at import time.
 */
export async function createE2eApp(): Promise<INestApplication> {
  const { AppModule } = await import('../src/app.module');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  // Mirrors main.ts exactly, including the aligned json body limit
  // (see main.ts: 2.5mb so the DTO's 2MB cap is actually reachable).
  const app = moduleRef.createNestApplication({ bodyParser: false });
  app.use(json({ limit: '2.5mb' }));
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  return app;
}

/**
 * Fixed template uuid from the seed manifest (storage/manifest.json is
 * mirrored from seed-assets and carries deterministic ids), e.g.
 * templateIdByFile('invoice.docx') -> '44444444-...'.
 */
export function templateIdByFile(templateFile: string): string {
  const manifestPath = path.join(STORAGE_ROOT, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
    id: string;
    storageKey: string;
  }[];
  const entry = manifest.find((e) => e.storageKey === `templates/${templateFile}`);
  if (!entry) throw new Error(`No template for templates/${templateFile} in ${manifestPath}`);
  return entry.id;
}

/** Absolute path of a seeded template file (the immutability subject). */
export function templateFilePath(templateFile: string): string {
  return path.join(STORAGE_ROOT, 'templates', templateFile);
}

/** Absolute path of a document copy created by POST /api/documents. */
export function documentFilePath(documentId: string, kind: string): string {
  return path.join(STORAGE_ROOT, 'documents', `${documentId}.${kind}`);
}

/** Round-trip oracle: strip tags, collapse whitespace, lowercase. */
export function normalizeText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Removes document copies created by a suite (test artifacts only). */
export function removeDocumentFiles(documents: { id: string; kind: string }[]): void {
  for (const doc of documents) rmSync(documentFilePath(doc.id, doc.kind), { force: true });
}

/** Deletes the isolated e2e database (called in every suite's afterAll). */
export function deleteTestDb(): void {
  rmSync(TEST_DB_PATH, { force: true });
  rmSync(`${TEST_DB_PATH}-journal`, { force: true });
}

/** Minimal structural type for superagent's two-argument response parser. */
type BinaryParser = (res: IncomingMessage, callback: (err: Error | null, body: Buffer) => void) => void;

const binaryParser: BinaryParser = (res, callback) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

/**
 * GET whose res.body is ALWAYS the raw Buffer. The office mime types are not
 * in superagent's known-binary list, so an explicit parser is the only
 * guaranteed way to bytes (used for file/export assertions + round-trip).
 * Note: superagent (supertest's transitive dep) is hidden from type
 * resolution by pnpm's strict node_modules, and supertest's parse() union
 * rejects locally-declared Response types — hence ONE explicit, documented
 * cast. The parser matches the runtime contract exactly.
 */
export function getBinary(server: Server, url: string) {
  return request(server)
    .get(url)
    .parse(binaryParser as unknown as never);
}
