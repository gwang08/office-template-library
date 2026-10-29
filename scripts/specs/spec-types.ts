// Shared content model — the SINGLE source of truth consumed by both the
// office-file writers and the SVG preview writers. Adding a template means
// appending one entry to a spec array; no UI/API changes (data-driven).

/** Hex colors WITHOUT leading '#', 6 digits — the format docx/pptx expect. */
export interface Palette {
  /** Page/slide background. */
  bg: string;
  /** Primary brand color (bands, table headers, accents). */
  accent: string;
  /** Secondary accent (highlights, shapes, pills). */
  accent2: string;
  /** Heading text color. */
  text: string;
  /** Body text color. */
  muted: string;
}

export type TemplateCategory = 'Business' | 'Finance' | 'Personal' | 'Education';
export type TemplateKind = 'docx' | 'pptx';

export interface DocRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export type DocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'para'; runs: DocRun[] }
  | { type: 'bullets'; items: string[] }
  | { type: 'numbered'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  /** Solid-color inline PNG (generated deterministically, no external file). */
  | { type: 'image'; label: string };

export interface DocSpec {
  /** Fixed uuid — hardcoded so seeds/e2e tests can rely on it. */
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  palette: Palette;
  blocks: DocBlock[];
}

export type SlideLayout = 'cover' | 'section' | 'bullets' | 'closing';

export interface SlideSpec {
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
}

export interface DeckSpec {
  /** Fixed uuid — hardcoded so seeds/e2e tests can rely on it. */
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  palette: Palette;
  /** Common web-safe family (no font embedding anywhere in the chain). */
  fontFace: string;
  slides: SlideSpec[];
}
