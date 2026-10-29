// Aggregate of all DOCX template specs — append a spec here (or in the
// topic files) and rerun `pnpm gen:assets` to grow the library.
import { DOCX_SPECS_BUSINESS } from './docx-specs-business';
import { DOCX_SPECS_PERSONAL } from './docx-specs-personal';
import { BUSINESS_PROPOSAL } from './docx-specs-proposal';
import type { DocSpec } from './spec-types';

export const DOCX_SPECS: DocSpec[] = [BUSINESS_PROPOSAL, ...DOCX_SPECS_BUSINESS, ...DOCX_SPECS_PERSONAL];
