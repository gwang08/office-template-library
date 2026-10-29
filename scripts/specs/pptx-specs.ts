// PPTX deck specs: Business Pitch (6 slides), Lesson Plan (5), Creative Portfolio (5).
// Decks deliberately use only text/rect/ellipse/solid fills (viewer fidelity —
// no charts, no gradients, web-safe fonts).
import type { DeckSpec } from './spec-types';

export const PPTX_SPECS: DeckSpec[] = [
  {
    id: '77777777-7777-4777-8777-777777777777',
    slug: 'business-pitch',
    name: 'Business Pitch',
    description: 'Six-slide investor pitch: problem, solution, market, model and ask.',
    category: 'Business',
    palette: { bg: '0F172A', accent: '38BDF8', accent2: 'F472B6', text: 'F8FAFC', muted: 'B8C4D9' },
    fontFace: 'Arial',
    slides: [
      { layout: 'cover', title: 'NorthPeak Analytics', subtitle: 'Series A — turning field data into decisions' },
      {
        layout: 'bullets',
        title: 'The Problem',
        bullets: [
          'Field teams capture inspections on paper and spreadsheets',
          'Data reaches decision-makers 2–3 weeks late',
          'Compliance audits require manual reconstruction of every visit',
        ],
      },
      {
        layout: 'bullets',
        title: 'Our Solution',
        bullets: [
          'Offline-first mobile capture with guided checklists',
          'Instant sync and exception alerts when connectivity returns',
          'One-click audit trail exported to PDF or API',
        ],
      },
      {
        layout: 'bullets',
        title: 'Market Opportunity',
        bullets: [
          '$4.2B field service software market, 11% CAGR',
          '12M field workers in North America and EU alone',
          'Beachhead: environmental compliance inspections (18k firms)',
        ],
      },
      {
        layout: 'bullets',
        title: 'Business Model',
        bullets: [
          'SaaS per inspector: $39/user/month',
          'Audit pack add-on: $490/site/year (68% attach today)',
          'Land-and-expand: pilot 10 inspectors → org-wide rollout',
        ],
      },
      {
        layout: 'closing',
        title: 'Raising $6M Series A',
        subtitle: '18-month runway to $3M ARR — hello@northpeak.io',
      },
    ],
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    slug: 'lesson-plan',
    name: 'Lesson Plan',
    description: 'Five-slide classroom lesson deck with objectives, timed flow and assessment checkpoints.',
    category: 'Education',
    palette: { bg: 'FFF8F0', accent: '4F46E5', accent2: 'F59E0B', text: '1E1B4B', muted: '52525B' },
    fontFace: 'Georgia',
    slides: [
      {
        layout: 'cover',
        title: 'Photosynthesis in Action',
        subtitle: 'Grade 7 Biology · 45-minute lesson · Ms. Alvarez',
      },
      {
        layout: 'bullets',
        title: 'Learning Objectives',
        bullets: [
          'Explain how light energy becomes chemical energy',
          'Identify the roles of chlorophyll, water and carbon dioxide',
          'Design a simple experiment to test light intensity effects',
        ],
      },
      {
        layout: 'bullets',
        title: 'Lesson Flow (45 min)',
        bullets: [
          'Warm-up: what do plants eat? (5 min discussion)',
          'Direct instruction with diagram walk-through (12 min)',
          'Lab stations: spinach-leaf discs under different lights (20 min)',
          'Exit ticket and recap (8 min)',
        ],
      },
      {
        layout: 'section',
        title: 'Assessment Checkpoints',
        subtitle: 'Observation during labs · exit ticket · Friday quiz',
      },
      {
        layout: 'closing',
        title: 'Homework & Resources',
        subtitle: 'Read chapter 4, collect one leaf sample, bring questions Monday',
      },
    ],
  },
  {
    id: '99999999-9999-4999-8999-999999999999',
    slug: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Bold five-slide designer portfolio with section dividers and selected work.',
    category: 'Personal',
    palette: { bg: '111111', accent: 'EC4899', accent2: 'F59E0B', text: 'FAFAFA', muted: 'A3A3A3' },
    fontFace: 'Verdana',
    slides: [
      {
        layout: 'cover',
        title: 'Mira Vasquez',
        subtitle: 'Visual designer — selected work 2023–2026',
      },
      {
        layout: 'section',
        title: 'Brand Systems',
        subtitle: 'Identity programs for three seed-stage teams',
      },
      {
        layout: 'bullets',
        title: 'Selected Projects',
        bullets: [
          'Ferment — packaging system for a natural wine club',
          'Loom&Ledger — identity and site for a craft accounting studio',
          'Fieldnotes — app icon set and illustration language',
          'Studio Mast — exhibition graphics, two city tour',
        ],
      },
      {
        layout: 'section',
        title: 'Illustration & Motion',
        subtitle: 'Editorial illustration and 15-second brand loops',
      },
      {
        layout: 'closing',
        title: 'Let’s make something',
        subtitle: 'mira@studiomira.co — full portfolio at studiomira.co',
      },
    ],
  },
];
