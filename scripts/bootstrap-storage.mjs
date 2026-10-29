#!/usr/bin/env node
// Idempotent local bootstrap, run as the first step of `pnpm setup`:
//   1. ensure the runtime storage/ tree exists,
//   2. mirror committed seed-assets/ into storage/,
//   3. create apps/api/.env from .env.example if missing (local defaults only).
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storageDir = path.join(repoRoot, 'storage');
const seedAssetsDir = path.join(repoRoot, 'seed-assets');
const envExample = path.join(repoRoot, 'apps/api/.env.example');
const envFile = path.join(repoRoot, 'apps/api/.env');

function fail(message) {
  console.error(`bootstrap-storage: ${message}`);
  process.exit(1);
}

if (!existsSync(seedAssetsDir)) {
  fail(`seed-assets/ not found at ${seedAssetsDir} — repository state is incomplete.`);
}

for (const dir of ['assets', 'templates', 'documents']) {
  mkdirSync(path.join(storageDir, dir), { recursive: true });
}

// force: overwrite changed files; recursive: nested thumbnail directories
cpSync(seedAssetsDir, storageDir, { recursive: true, force: true });
console.log(`bootstrap-storage: synced ${seedAssetsDir} -> ${storageDir}`);

if (!existsSync(envFile)) {
  if (!existsSync(envExample)) {
    fail(`apps/api/.env.example not found at ${envExample}.`);
  }
  copyFileSync(envExample, envFile);
  console.log(`bootstrap-storage: created ${envFile} from .env.example`);
}
