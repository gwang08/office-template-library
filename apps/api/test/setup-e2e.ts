// E2E environment bootstrap — loaded via jest `setupFiles`, which runs BEFORE
// each spec file's module registry is populated. Setting DATABASE_URL here
// guarantees PrismaService (constructed when the AppModule is imported in
// createE2eApp) always binds to the isolated test database.
//
// SAFETY: this file must NEVER point at storage/dev.db — dev.db holds dev
// data. The absolute path below is the dedicated e2e database, deleted both
// here (before each suite) and in each suite's afterAll.
import { rmSync } from 'node:fs';
import path from 'node:path';

// test -> apps/api -> repo root -> storage/test.db (never dev.db).
export const TEST_DB_PATH = path.resolve(__dirname, '../../../storage/test.db');

process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

// Stale db from an aborted run must not leak rows into this suite.
rmSync(TEST_DB_PATH, { force: true });
rmSync(`${TEST_DB_PATH}-journal`, { force: true });

// Human-auditable proof of isolation (jest prints this per suite).
console.log(`[setup-e2e] DATABASE_URL=${process.env.DATABASE_URL}`);
