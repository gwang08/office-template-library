// Finance + Personal DOCX templates: Invoice, Cover Letter, Resume.
import type { DocSpec } from './spec-types';

export const DOCX_SPECS_PERSONAL: DocSpec[] = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    slug: 'invoice',
    name: 'Invoice',
    description: 'Clean service invoice with line-item table, totals and payment instructions.',
    category: 'Finance',
    palette: { bg: 'FFFFFF', accent: '1D4ED8', accent2: 'EA580C', text: '111827', muted: '4B5563' },
    blocks: [
      { type: 'heading', level: 1, text: 'Invoice INV-2026-0142' },
      {
        type: 'para',
        runs: [
          { text: 'From: ' },
          { text: 'Studio Lumen LLC', bold: true },
          { text: ' · 48 Harbor Lane, Seattle, WA · billing@studiolumen.co' },
        ],
      },
      {
        type: 'para',
        runs: [
          { text: 'Bill to: ' },
          { text: 'Cascade Dental Group', bold: true },
          { text: ' · Issued: ' },
          { text: 'October 28, 2026', italic: true },
          { text: ' · Due: ' },
          { text: 'November 11, 2026', bold: true, underline: true },
        ],
      },
      { type: 'image', label: 'Studio Lumen — brand mark' },
      { type: 'heading', level: 2, text: 'Line Items' },
      {
        type: 'table',
        header: ['Description', 'Qty', 'Unit Price', 'Amount'],
        rows: [
          ['Website redesign — discovery and wireframes', '1', '$1,800.00', '$1,800.00'],
          ['Website redesign — page templates (6)', '6', '$420.00', '$2,520.00'],
          ['Booking flow integration', '1', '$1,150.00', '$1,150.00'],
          ['Content migration (per page)', '14', '$60.00', '$840.00'],
        ],
      },
      { type: 'heading', level: 2, text: 'Total Due' },
      {
        type: 'para',
        runs: [
          { text: 'Subtotal $6,310.00 · Sales tax (10.1%) $637.31 · ' },
          { text: 'Total due: $6,947.31', bold: true, underline: true },
        ],
      },
      { type: 'heading', level: 2, text: 'Payment Instructions' },
      {
        type: 'numbered',
        items: [
          'Pay by bank transfer to Studio Lumen LLC, account 0043 8871 2290, routing 125000024',
          'Reference the invoice number INV-2026-0142 in the payment memo',
          'Net-14 terms; a 1.5% monthly late fee applies after the due date',
        ],
      },
      { type: 'heading', level: 2, text: 'Notes' },
      {
        type: 'para',
        runs: [
          { text: 'Thank you for your business. Questions about this invoice? Reply to ' },
          { text: 'billing@studiolumen.co', italic: true },
          { text: ' and we respond within one business day.' },
        ],
      },
    ],
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    slug: 'cover-letter',
    name: 'Cover Letter',
    description: 'One-page application cover letter with emphasis formatting and a strengths summary.',
    category: 'Personal',
    palette: { bg: 'FFFFFF', accent: '374151', accent2: '2563EB', text: '1F2937', muted: '4B5563' },
    blocks: [
      { type: 'heading', level: 1, text: 'Sarah Chen — Product Designer' },
      {
        type: 'para',
        runs: [
          { text: 'sarah.chen@designmail.co', italic: true },
          { text: ' · (206) 555-0184 · Seattle, WA · ' },
          { text: 'October 2026', italic: true },
        ],
      },
      { type: 'para', runs: [{ text: 'Dear Harbor Analytics Hiring Team,' }] },
      {
        type: 'para',
        runs: [
          { text: 'I am applying for the Senior Product Designer role at ' },
          { text: 'Harbor Analytics', bold: true },
          { text: '. For the past six years I have designed data-heavy products where the hardest problem is not visual polish but ' },
          { text: 'making complex information feel obvious', underline: true },
          { text: ' — exactly the challenge described in your job posting.' },
        ],
      },
      {
        type: 'para',
        runs: [
          { text: 'At Tidepool I led the redesign of a fleet analytics console used daily by 2,400 operators. We cut the average time to build a report from ' },
          { text: 'nine minutes to under three', bold: true },
          { text: ', and weekly active reporting grew 41% in the following quarter. Before that I shipped onboarding for a fintech app that reached ' },
          { text: 'first-in-industry', italic: true },
          { text: ' activation benchmarks.' },
        ],
      },
      { type: 'heading', level: 2, text: 'What I Would Bring' },
      {
        type: 'bullets',
        items: [
          'End-to-end ownership: research, flows, prototypes, design systems, and hand-off',
          'Fluent with engineering — I prototype in code and speak SQL',
          'Track record turning ambiguous analytics domains into simple, guided workflows',
        ],
      },
      {
        type: 'para',
        runs: [
          { text: 'I would welcome the chance to walk through my portfolio and hear how your team is approaching the dashboard refresh mentioned on your blog. Thank you for your consideration.' },
        ],
      },
      { type: 'para', runs: [{ text: 'Warm regards,' }, { text: 'Sarah Chen', bold: true }] },
    ],
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    slug: 'resume',
    name: 'Resume',
    description: 'Single-page resume with summary, skills, experience table and education highlights.',
    category: 'Personal',
    palette: { bg: 'FFFFFF', accent: '111827', accent2: 'D97706', text: '111827', muted: '4B5563' },
    blocks: [
      { type: 'heading', level: 1, text: 'Daniel Rivera — Senior Backend Engineer' },
      {
        type: 'para',
        runs: [
          { text: 'daniel.rivera.dev@mailbox.co · github.com/drivera-dev · Portland, OR', italic: true },
        ],
      },
      { type: 'image', label: 'Accent divider' },
      { type: 'heading', level: 2, text: 'Summary' },
      {
        type: 'para',
        runs: [
          { text: 'Backend engineer with ' },
          { text: 'nine years', bold: true },
          { text: ' building high-throughput APIs and event pipelines in Go and TypeScript. Recent focus: ' },
          { text: 'payments infrastructure', underline: true },
          { text: ' processing 40M+ monthly transactions at 99.98% availability.' },
        ],
      },
      { type: 'heading', level: 2, text: 'Core Skills' },
      {
        type: 'bullets',
        items: [
          'Languages: Go, TypeScript, SQL — deep and current in all three',
          'Systems: Kafka, PostgreSQL, Redis, Kubernetes, Terraform',
          'Practices: event-driven design, observability-first operations, trunk-based delivery',
        ],
      },
      { type: 'heading', level: 2, text: 'Experience' },
      {
        type: 'table',
        header: ['Role', 'Company', 'Period'],
        rows: [
          ['Senior Backend Engineer', 'Fernway Payments', '2022 – present'],
          ['Backend Engineer', 'Loopline Logistics', '2019 – 2022'],
          ['Software Engineer', 'Brightloom', '2017 – 2019'],
        ],
      },
      {
        type: 'bullets',
        items: [
          'Led ledger-service rewrite: p99 latency 840ms to 110ms, zero reconciliation incidents since launch',
          'Designed idempotent payout API adopted by three internal teams as the payments standard',
          'On-call architect for settlement pipeline — reduced MTTR from 45 to 12 minutes',
        ],
      },
      { type: 'heading', level: 2, text: 'Education & Certifications' },
      {
        type: 'numbered',
        items: [
          'B.S. Computer Science, University of Oregon (2017)',
          'AWS Solutions Architect – Professional (2025)',
          'Kubernetes CKA (2024)',
        ],
      },
    ],
  },
];
