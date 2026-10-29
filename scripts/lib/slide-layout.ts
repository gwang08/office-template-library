// Slide layout engine — turns a SlideSpec + Palette into normalized (0..1)
// geometry shared by BOTH the pptxgenjs writer and the SVG preview writer.
// Structural parity is by construction: one function, two renderers.
import type { Palette, SlideSpec } from '../specs/spec-types';

export type Align = 'left' | 'center' | 'right';

export interface ShapeElement {
  kind: 'rect' | 'ellipse';
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  /** 0-100, matching pptxgenjs `fill.transparency` semantics. */
  transparency?: number;
}

export interface TextElement {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  /** Points — pptx uses pt directly; SVG multiplies by 128/72 px-per-pt. */
  fontSize: number;
  bold?: boolean;
  color: string;
  align: Align;
}

export interface NormalizedSlide {
  bg: string;
  shapes: ShapeElement[];
  texts: TextElement[];
}

export function layoutSlide(slide: SlideSpec, palette: Palette): NormalizedSlide {
  switch (slide.layout) {
    case 'cover':
      return coverLayout(slide, palette);
    case 'section':
      return sectionLayout(slide, palette);
    case 'closing':
      return closingLayout(slide, palette);
    default:
      return bulletsLayout(slide, palette);
  }
}

function coverLayout(slide: SlideSpec, p: Palette): NormalizedSlide {
  return {
    bg: p.bg,
    shapes: [
      { kind: 'ellipse', x: 0.7, y: -0.3, w: 0.55, h: 0.95, fill: p.accent, transparency: 55 },
      { kind: 'ellipse', x: 0.82, y: 0.52, w: 0.34, h: 0.62, fill: p.accent2, transparency: 45 },
      { kind: 'rect', x: 0.06, y: 0.47, w: 0.09, h: 0.012, fill: p.accent2 },
    ],
    texts: [
      { x: 0.06, y: 0.3, w: 0.75, h: 0.16, text: slide.title, fontSize: 54, bold: true, color: p.text, align: 'left' },
      { x: 0.06, y: 0.53, w: 0.72, h: 0.08, text: slide.subtitle ?? '', fontSize: 20, color: p.muted, align: 'left' },
    ],
  };
}

function sectionLayout(slide: SlideSpec, p: Palette): NormalizedSlide {
  return {
    bg: p.bg,
    shapes: [
      { kind: 'rect', x: 0, y: 0, w: 0.02, h: 1, fill: p.accent },
      { kind: 'rect', x: 0.08, y: 0.44, w: 0.14, h: 0.014, fill: p.accent2 },
    ],
    texts: [
      { x: 0.08, y: 0.3, w: 0.84, h: 0.14, text: slide.title, fontSize: 44, bold: true, color: p.text, align: 'left' },
      { x: 0.08, y: 0.5, w: 0.8, h: 0.08, text: slide.subtitle ?? '', fontSize: 20, color: p.muted, align: 'left' },
    ],
  };
}

function closingLayout(slide: SlideSpec, p: Palette): NormalizedSlide {
  return {
    bg: p.bg,
    shapes: [
      { kind: 'ellipse', x: -0.18, y: 0.55, w: 0.5, h: 0.85, fill: p.accent, transparency: 50 },
      { kind: 'rect', x: 0.42, y: 0.62, w: 0.16, h: 0.012, fill: p.accent2 },
    ],
    texts: [
      { x: 0.1, y: 0.36, w: 0.8, h: 0.14, text: slide.title, fontSize: 46, bold: true, color: p.text, align: 'center' },
      { x: 0.1, y: 0.52, w: 0.8, h: 0.08, text: slide.subtitle ?? '', fontSize: 20, color: p.muted, align: 'center' },
    ],
  };
}

function bulletsLayout(slide: SlideSpec, p: Palette): NormalizedSlide {
  const bullets = slide.bullets ?? [];
  const shapes: ShapeElement[] = [
    { kind: 'rect', x: 0.06, y: 0.19, w: 0.1, h: 0.012, fill: p.accent2 },
  ];
  const texts: TextElement[] = [
    { x: 0.06, y: 0.07, w: 0.88, h: 0.1, text: slide.title, fontSize: 32, bold: true, color: p.text, align: 'left' },
  ];
  bullets.forEach((line, i) => {
    const top = 0.28 + i * 0.13;
    shapes.push({ kind: 'ellipse', x: 0.07, y: top + 0.022, w: 0.011, h: 0.03, fill: p.accent });
    texts.push({ x: 0.11, y: top, w: 0.82, h: 0.1, text: line, fontSize: 18, color: p.muted, align: 'left' });
  });
  return { bg: p.bg, shapes, texts };
}
