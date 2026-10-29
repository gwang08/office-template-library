// Manifest model + writer. seed-assets/manifest.json is the contract between
// the design-time generators and the runtime seed (apps/api/prisma/seed.ts).
// It is regenerated wholesale on every `pnpm gen:assets` run.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DeckSpec, DocSpec, TemplateKind } from '../specs/spec-types';

const SEED_ASSETS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..', 'seed-assets');

export interface ManifestSlide {
  order: number;
  title: string;
  previewKey: string;
}

export interface ManifestEntry {
  id: string;
  kind: TemplateKind;
  name: string;
  description: string;
  category: string;
  /** Path relative to storage/ root (e.g. "templates/invoice.docx"). */
  storageKey: string;
  /** Path relative to storage/ root (e.g. "assets/thumbs/invoice/card.svg"). */
  thumbnailKey: string;
  slides: ManifestSlide[];
}

export function manifestEntryForDocx(spec: DocSpec): ManifestEntry {
  return {
    id: spec.id,
    kind: 'docx',
    name: spec.name,
    description: spec.description,
    category: spec.category,
    storageKey: `templates/${spec.slug}.docx`,
    thumbnailKey: `assets/thumbs/${spec.slug}/card.svg`,
    slides: [],
  };
}

export function manifestEntryForDeck(spec: DeckSpec): ManifestEntry {
  return {
    id: spec.id,
    kind: 'pptx',
    name: spec.name,
    description: spec.description,
    category: spec.category,
    storageKey: `templates/${spec.slug}.pptx`,
    thumbnailKey: `assets/thumbs/${spec.slug}/slide-01.svg`,
    slides: spec.slides.map((slide, index) => ({
      order: index + 1,
      title: slide.title,
      previewKey: `assets/thumbs/${spec.slug}/slide-${String(index + 1).padStart(2, '0')}.svg`,
    })),
  };
}

export function writeManifest(entries: ManifestEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.storageKey.localeCompare(b.storageKey));
  const target = path.join(SEED_ASSETS_DIR, 'manifest.json');
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(sorted, null, 2)}\n`);
  return target;
}

export const seedAssetsDir = SEED_ASSETS_DIR;
