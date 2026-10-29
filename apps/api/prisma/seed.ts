// Seed: reads storage/manifest.json (mirrored from seed-assets/ by
// `pnpm bootstrap`) and upserts Templates by their FIXED uuids.
// Slides are replaced only when they differ, so re-running `pnpm bootstrap`
// (or `db:seed` alone) is idempotent: still 9 templates, no duplicate slides.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

interface ManifestSlide {
  order: number;
  title: string;
  previewKey: string;
}

interface ManifestEntry {
  id: string;
  kind: string;
  name: string;
  description: string;
  category: string;
  storageKey: string;
  thumbnailKey: string;
  slides: ManifestSlide[];
}

const prisma = new PrismaClient();

function loadManifest(): ManifestEntry[] {
  // apps/api/prisma -> repo root -> storage/manifest.json
  const manifestPath = path.resolve(__dirname, '../../../storage/manifest.json');
  try {
    const raw = JSON.parse(readFileSync(manifestPath, 'utf-8')) as ManifestEntry[];
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('manifest is empty');
    for (const entry of raw) {
      if (!entry.id || !entry.kind || !entry.storageKey) {
        throw new Error(`manifest entry missing id/kind/storageKey: ${JSON.stringify(entry).slice(0, 120)}`);
      }
    }
    return raw;
  } catch (error) {
    throw new Error(
      `Cannot read ${manifestPath} (${(error as Error).message}). Run \`pnpm gen:assets\` then \`pnpm bootstrap\` first.`,
    );
  }
}

function slidesMatch(
  existing: { order: number; title: string; previewKey: string }[],
  wanted: ManifestSlide[],
): boolean {
  return (
    existing.length === wanted.length &&
    existing.every((slide, i) =>
      [slide.order, slide.title, slide.previewKey].join('\u0000') ===
      [wanted[i].order, wanted[i].title, wanted[i].previewKey].join('\u0000'),
    )
  );
}

async function seedTemplate(entry: ManifestEntry): Promise<boolean> {
  await prisma.template.upsert({
    where: { id: entry.id },
    create: {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      category: entry.category,
      kind: entry.kind,
      storageKey: entry.storageKey,
      thumbnailKey: entry.thumbnailKey,
    },
    update: {
      name: entry.name,
      description: entry.description,
      category: entry.category,
      kind: entry.kind,
      storageKey: entry.storageKey,
      thumbnailKey: entry.thumbnailKey,
    },
    include: { slides: { orderBy: { order: 'asc' } } },
  });

  const existingSlides = await prisma.templateSlide.findMany({
    where: { templateId: entry.id },
    orderBy: { order: 'asc' },
  });
  if (slidesMatch(existingSlides, entry.slides)) return false;

  await prisma.templateSlide.deleteMany({ where: { templateId: entry.id } });
  for (const slide of entry.slides) {
    await prisma.templateSlide.create({
      data: { templateId: entry.id, order: slide.order, title: slide.title, previewKey: slide.previewKey },
    });
  }
  return true;
}

async function main(): Promise<void> {
  const entries = loadManifest();
  let replacedSlideSets = 0;
  for (const entry of entries) {
    if (await seedTemplate(entry)) replacedSlideSets++;
  }
  const templates = await prisma.template.count();
  const slides = await prisma.templateSlide.count();
  console.log(
    `Seed: upserted ${entries.length} templates (${replacedSlideSets} slide sets replaced) — db now has ${templates} templates, ${slides} slides.`,
  );
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
