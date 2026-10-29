// Seed stub — Phase 02 replaces this with manifest-driven upserts
// (fixed uuids, idempotent re-runs). Kept as a real DB round-trip so
// `pnpm setup` proves Prisma wiring end to end in Phase 01.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const count = await prisma.template.count();
  console.log(`Seed (stub): template table currently has ${count} rows — real seeding lands in Phase 02.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
