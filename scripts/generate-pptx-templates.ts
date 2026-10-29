// PPTX generator: DeckSpec --pptxgenjs--> .pptx + one SVG preview per slide.
// Both artifacts consume layoutSlide() output, so preview parity is structural.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';
import type { DeckSpec } from './specs/spec-types';
import { layoutSlide } from './lib/slide-layout';
import { slideSvg } from './lib/svg-card';
import { manifestEntryForDeck, seedAssetsDir, type ManifestEntry } from './lib/manifest';

/** pptxgenjs LAYOUT_16x9 canvas in inches (10 x 5.625). */
const CANVAS = { w: 10, h: 5.625 };

/** Generates one .pptx + per-slide SVGs; returns the manifest entry. */
export async function generatePptxDeck(spec: DeckSpec): Promise<ManifestEntry> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'office-template-library';
  pptx.company = 'office-template-library';
  pptx.title = spec.name;
  pptx.subject = spec.description;

  for (const slide of spec.slides) {
    const layout = layoutSlide(slide, spec.palette);
    const target = pptx.addSlide();
    target.background = { color: layout.bg };
    for (const shape of layout.shapes) {
      target.addShape(shape.kind === 'rect' ? pptx.ShapeType.rect : pptx.ShapeType.ellipse, {
        x: shape.x * CANVAS.w,
        y: shape.y * CANVAS.h,
        w: shape.w * CANVAS.w,
        h: shape.h * CANVAS.h,
        fill: { color: shape.fill, transparency: shape.transparency ?? 0 },
      });
    }
    for (const text of layout.texts) {
      if (!text.text) continue;
      target.addText(text.text, {
        x: text.x * CANVAS.w,
        y: text.y * CANVAS.h,
        w: text.w * CANVAS.w,
        h: text.h * CANVAS.h,
        fontSize: text.fontSize,
        bold: text.bold ?? false,
        color: text.color,
        align: text.align,
        fontFace: spec.fontFace,
        margin: 0,
      });
    }
  }

  const pptxPath = path.join(seedAssetsDir, 'templates', `${spec.slug}.pptx`);
  mkdirSync(path.dirname(pptxPath), { recursive: true });
  await pptx.writeFile({ fileName: pptxPath });

  const thumbDir = path.join(seedAssetsDir, 'assets', 'thumbs', spec.slug);
  mkdirSync(thumbDir, { recursive: true });
  spec.slides.forEach((slide, index) => {
    const name = `slide-${String(index + 1).padStart(2, '0')}.svg`;
    writeFileSync(path.join(thumbDir, name), slideSvg(slide, spec));
  });

  return manifestEntryForDeck(spec);
}
