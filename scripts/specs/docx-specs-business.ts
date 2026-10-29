// Business DOCX templates: Meeting Minutes and Project Status Report.
import type { DocSpec } from './spec-types';

export const DOCX_SPECS_BUSINESS: DocSpec[] = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'meeting-minutes',
    name: 'Meeting Minutes',
    description: 'Formal minutes template with attendees table, agenda, discussion notes, decisions and action items.',
    category: 'Business',
    palette: { bg: 'FFFFFF', accent: '334155', accent2: '0D9488', text: '1F2937', muted: '475569' },
    blocks: [
      { type: 'heading', level: 1, text: 'Quarterly Planning Meeting — Minutes' },
      {
        type: 'para',
        runs: [
          { text: 'Date: ' },
          { text: 'Tuesday, April 14, 2026', bold: true },
          { text: ' · Location: ' },
          { text: 'Headquarters, Room 4B', italic: true },
          { text: ' · Facilitator: ' },
          { text: 'Dana Whitfield', bold: true },
        ],
      },
      { type: 'heading', level: 2, text: 'Attendees' },
      {
        type: 'table',
        header: ['Name', 'Role', 'Attendance'],
        rows: [
          ['Dana Whitfield', 'VP Product', 'Present'],
          ['Marcus Lee', 'Engineering Lead', 'Present'],
          ['Priya Raman', 'Head of Design', 'Present'],
          ['Tom Becker', 'Finance Partner', 'Remote'],
        ],
      },
      { type: 'heading', level: 2, text: 'Agenda' },
      {
        type: 'numbered',
        items: [
          'Q1 results review and variance against plan',
          'Q2 priorities: retention, onboarding revamp, pricing experiments',
          'Hiring plan and budget reallocation',
          'Risks and open questions',
        ],
      },
      { type: 'heading', level: 2, text: 'Discussion Highlights' },
      {
        type: 'bullets',
        items: [
          'Q1 revenue landed 4% under plan; churn on the Starter tier was the main driver',
          'Onboarding revamp is the highest-leverage Q2 bet — activation is flat at 41%',
          'Pricing experiments need a clean cohort design before the summer release',
          'Engineering needs one senior data engineer to support the retention roadmap',
        ],
      },
      { type: 'heading', level: 2, text: 'Decisions' },
      {
        type: 'bullets',
        items: [
          'Q2 OKRs will weight retention above new-logo acquisition',
          'Onboarding revamp enters build in sprint 24.2 with Priya as DRI',
          'Budget approved for one senior data engineer requisition',
        ],
      },
      { type: 'heading', level: 2, text: 'Action Items' },
      {
        type: 'table',
        header: ['Owner', 'Action', 'Due'],
        rows: [
          ['Marcus Lee', 'Draft Q2 OKR document for leadership review', 'Apr 18'],
          ['Priya Raman', 'Share onboarding revamp discovery summary', 'Apr 16'],
          ['Tom Becker', 'Model churn impact of two pricing scenarios', 'Apr 25'],
        ],
      },
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'project-status-report',
    name: 'Project Status Report',
    description: 'Weekly project report with RAG milestone table, risk register, accomplishments and next-week plan.',
    category: 'Business',
    palette: { bg: 'FFFFFF', accent: '1F2937', accent2: '059669', text: '111827', muted: '4B5563' },
    blocks: [
      { type: 'heading', level: 1, text: 'Atlas Platform — Weekly Status Report (Week 42)' },
      {
        type: 'para',
        runs: [
          { text: 'Project: ' },
          { text: 'Atlas Customer Portal', bold: true },
          { text: ' · Reporting period: ' },
          { text: 'October 13–17, 2026', italic: true },
          { text: ' · Overall status: ' },
          { text: 'Amber', bold: true, underline: true },
          { text: ' (schedule risk on integration testing)' },
        ],
      },
      { type: 'image', label: 'Atlas Platform — status header graphic' },
      { type: 'heading', level: 2, text: 'Summary' },
      {
        type: 'para',
        runs: [
          { text: 'Checkout and account modules are feature-complete and in staging. The payments partner delayed sandbox credentials by five days, which pushes ' },
          { text: 'integration testing to start October 27', bold: true },
          { text: '. The team absorbed the wait by pulling forward accessibility fixes, so overall scope remains protected.' },
        ],
      },
      { type: 'heading', level: 2, text: 'Milestones' },
      {
        type: 'table',
        header: ['Milestone', 'Status', 'Target', 'Owner'],
        rows: [
          ['Discovery & design sign-off', 'Done', 'Sep 12', 'Priya Raman'],
          ['Checkout module complete', 'Done', 'Oct 10', 'Marcus Lee'],
          ['Payments integration testing', 'At risk', 'Nov 7', 'Ana Duarte'],
          ['Public beta launch', 'On track', 'Dec 2', 'Dana Whitfield'],
        ],
      },
      { type: 'heading', level: 2, text: 'Risks & Mitigations' },
      {
        type: 'bullets',
        items: [
          'Sandbox credential delay (high): escalate to partner TAM; buffer already built into beta date',
          'Load test environment shared with another program (medium): reserve dedicated window by Oct 24',
          'Copy freeze during beta (low): pre-approve launch copy one sprint early',
        ],
      },
      { type: 'heading', level: 2, text: 'Planned for Next Week' },
      {
        type: 'numbered',
        items: [
          'Complete regression pass on checkout refund paths',
          'Begin payments integration once credentials arrive',
          'Run first accessibility audit with external reviewer',
          'Publish updated burndown to the steering committee',
        ],
      },
    ],
  },
];
