// Business Proposal DOCX template (split out of docx-specs-business.ts to
// respect the file-size cap).
import type { DocSpec } from './spec-types';

export const BUSINESS_PROPOSAL: DocSpec = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'business-proposal',
    name: 'Business Proposal',
    description: 'Structured services proposal with executive summary, approach, tiered pricing table and next steps.',
    category: 'Business',
    palette: { bg: 'FFFFFF', accent: '1E3A5F', accent2: 'C9A227', text: '1F2937', muted: '4B5563' },
    blocks: [
      { type: 'heading', level: 1, text: 'Digital Transformation Proposal — Northwind Logistics' },
      {
        type: 'para',
        runs: [
          { text: 'Prepared for: ' },
          { text: 'Northwind Logistics', bold: true },
          { text: ' · Prepared by: ' },
          { text: 'Meridian Consulting Group', bold: true },
          { text: ' · Date: ' },
          { text: 'March 2026', italic: true },
        ],
      },
      { type: 'image', label: 'Meridian Consulting — proposal cover banner' },
      { type: 'heading', level: 2, text: 'Executive Summary' },
      {
        type: 'para',
        runs: [
          { text: 'Northwind Logistics currently reconciles shipment data across ' },
          { text: 'nine disconnected systems', bold: true },
          { text: ', adding an average of ' },
          { text: '3.2 days', underline: true },
          { text: ' to month-end closing. We propose a 16-week program that consolidates order, fleet and warehouse data onto a single reporting platform. Comparable programs at ' },
          { text: 'Harbor Freight and Atlas Foods', italic: true },
          { text: ' reduced closing time by 68% within two quarters.' },
        ],
      },
      { type: 'heading', level: 2, text: 'Objectives' },
      {
        type: 'bullets',
        items: [
          'Consolidate order, fleet and warehouse data into one governed warehouse',
          'Cut month-end closing from five days to under two days',
          'Give regional managers self-service dashboards instead of spreadsheet reports',
          'Establish data quality SLAs with automated anomaly alerts',
        ],
      },
      { type: 'heading', level: 2, text: 'Proposed Approach' },
      {
        type: 'numbered',
        items: [
          'Discovery (weeks 1–3): stakeholder interviews, source-system inventory, data profiling',
          'Foundation (weeks 4–7): warehouse schema, ingestion pipelines, identity reconciliation',
          'Migration (weeks 8–12): phased cutover by business unit with parallel runs',
          'Enablement (weeks 13–15): dashboard rollout, training for 40+ regional managers',
          'Stabilization (week 16): hypercare, documentation handover, SLA activation',
        ],
      },
      { type: 'heading', level: 2, text: 'Investment Summary' },
      {
        type: 'table',
        header: ['Package', 'Scope', 'Timeline', 'Price (USD)'],
        rows: [
          ['Starter', 'Order data only, 10 dashboards', '10 weeks', '$180,000'],
          ['Growth', 'Orders + fleet + warehouse, 25 dashboards', '16 weeks', '$340,000'],
          ['Enterprise', 'Full scope, custom integrations, 12-month SLA', '22 weeks', '$520,000'],
        ],
      },
      { type: 'heading', level: 2, text: 'Why Meridian' },
      {
        type: 'para',
        runs: [
          { text: 'Our logistics practice has delivered ' },
          { text: '23 warehouse consolidation programs', bold: true },
          { text: ' since 2019 with a 96% on-time completion rate. Every engagement is led by a partner-level consultant, not delegated after the sale.' },
        ],
      },
      { type: 'heading', level: 2, text: 'Next Steps' },
      {
        type: 'bullets',
        items: [
          'Review proposal with the Northwind steering committee (target: April 4)',
          '90-minute technical deep-dive with the IT architecture board',
          'Countersign the Statement of Work to reserve the Q3 delivery slot',
        ],
      },
    ],
};