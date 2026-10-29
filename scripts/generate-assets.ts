// Orchestrator: regenerates the whole committed seed-assets/ tree.
//   pnpm --filter scripts generate   (root alias: pnpm gen:assets)
// Output is deterministic for SVG/manifest; reruns are safe (tree is rebuilt).
import { rmSync } from 'node:fs';
import path from 'node:path';
import { DOCX_SPECS } from './specs/docx-specs';
import { PPTX_SPECS } from './specs/pptx-specs';
import { generateDocxTemplate } from './generate-docx-templates';
import { generatePptxDeck } from './generate-pptx-templates';
import { seedAssetsDir, writeManifest, type ManifestEntry } from './lib/manifest';

async function main(): Promise<void> {
  // Rebuild from scratch so removed specs never leave orphan files behind.
  rmSync(path.join(seedAssetsDir, 'templates'), { recursive: true, force: true });
  rmSync(path.join(seedAssetsDir, 'assets'), { recursive: true, force: true });

  const entries: ManifestEntry[] = [];
  for (const spec of DOCX_SPECS) {
    entries.push(await generateDocxTemplate(spec));
    console.log(`docx  ${spec.slug}.docx + card.svg`);
  }
  for (const spec of PPTX_SPECS) {
    entries.push(await generatePptxDeck(spec));
    console.log(`pptx  ${spec.slug}.pptx + ${spec.slides.length} slide svgs`);
  }

  const manifestPath = writeManifest(entries);
  console.log(`manifest  ${path.relative(process.cwd(), manifestPath)} (${entries.length} templates)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
