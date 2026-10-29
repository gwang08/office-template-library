# Delivery Package

Handover document for the Office Template Library take-home submission. Companion to
[README.md](../README.md) (quickstart + architecture) and [API.md](./API.md) (endpoint
reference). Everything described here exists in the code on branch `main` at the delivery commit
(tag `v1.0.0`).

> [Screen recording: placeholder — to be added]

## Requirements status matrix

Status per the recruiter's requirement list. Evidence points to files, endpoints, tests or
verification session outputs — not intentions.

### P1 — DOCX template product

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Library UI: grid with thumbnails, name, description, category | Done | `apps/web/src/features/library/library-page.tsx` + `components/template-card.tsx`; 9 cards live-verified in browser (phase-03 report, §verification) |
| 2 | Search + category filter | Done | Debounced (300 ms) `SearchBar` + category chips derived from data; API `GET /api/templates?search=&category=&kind=` — filter matrix verified live and in e2e (`apps/api/test/templates.e2e-spec.ts`) |
| 3 | Template preview page/modal | Done | `features/template-preview/preview-modal.tsx`; docx = sanitized mammoth HTML (`sanitize-html.ts` allowlist scrub); pptx = per-slide SVG grid |
| 4 | Use template → creates a new document | Done | `POST /api/documents` → byte-for-byte copy at `storage/documents/{docId}.docx` + `contentHtml` extract; template-immutability checksum e2e (`test/documents-docx.e2e-spec.ts`) |
| 5 | Edit in integrated editor | Done (docx) | Tiptap editor `features/editor/*`; pptx documents are guarded (redirect to their document page) — see limitation L2 |
| 6 | Save + download | Done | Save = `PATCH /api/documents/:id` (partial, title-only PATCH proven not to clobber content); download = `GET /api/documents/:id/export` (attachment, ascii-slug filename) |
| 7 | Template data model: id, name, category, description, file, preview | Done | `apps/api/prisma/schema.prisma` (Template/TemplateSlide/Document); modeled in [API.md](./API.md#data-model) |
| 8 | At least 5 sample templates | Done | 6 DOCX templates (Business Proposal, Meeting Minutes, Project Status Report, Invoice, Cover Letter, Resume) — seeded by `pnpm bootstrap` |
| 9 | Add template without UI change | Done | One spec entry in `scripts/specs/` → `pnpm gen:assets` → `pnpm bootstrap`; walkthrough in README ("Adding a new template") |
| 10 | Loading / error / not-found states | Done | `components/state-blocks.tsx` (skeleton grid, ErrorState + retry, EmptyState, Spinner); API-down recovery + unknown-id 404 states verified in real browser (phase-03/04b reports) |
| 11 | DOCX basic formatting preserved | Done | Round-trip verified: h1/h2/h3, bold, italic, underline, bullet/ordered lists, tables, inline images survive ingest → edit → export → re-ingest (e2e `documents-docx.e2e-spec.ts` + real-browser step-by-step in phase-04b report). Cosmetic properties (alignment/colors/font sizes/table cosmetics) are outside mammoth's HTML model — limitation L3 |

### P2 — PPTX template product

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Grid + thumbnails | Done | Cards use slide-1 SVG (`thumbnailKey`); 3 decks in the grid |
| 2 | Search + categorize | Done | Same search/category/kind filters cover pptx (`kind=pptx` verified live + e2e) |
| 3 | Deck preview | Done (see L4) | Per-slide SVG previews (16 committed SVGs) rendered in the modal and on the document page (`features/documents/pptx-slide-strip.tsx`); live in-browser render blocked by a root-caused third-party defect pair — L4, told honestly with the full story |
| 4 | Select → new independent copy | Done | `PptxHandler.createDocumentCopy` = `copyFile` (no conversion); sha256(copy) == sha256(template) verified live and in e2e (`test/documents-pptx.e2e-spec.ts`) |
| 5 | Open & edit in a compatible app | Partial | Download verified end-to-end (byte-identical copy, `unzip -t` clean = structurally valid OOXML). **No presentation application was installed on the build machine, so "opens in PowerPoint" was not demonstrated** — the file is verified valid OOXML, a byte-identical copy, and `unzip -t` clean. Editing happens in the user's own presentation app. See L2/L4 |
| 6 | Download PPTX | Done | `GET /api/documents/:id/export` → `Content-Type: presentationml.presentation`, `Content-Disposition: attachment; filename="business-pitch.pptx"` |
| 7 | ≥3 sets, each with name + description + thumbnails + slide previews | Done | Business Pitch (6 slides), Creative Portfolio (5), Lesson Plan (5) = 16 slide SVGs; each deck has name, description, thumbnail, ordered slide previews |
| 8 | Add/update without rebuild | Done | Same data-driven path as P1 #9: edit/append spec → `pnpm gen:assets` → `pnpm bootstrap` re-seeds (upsert by fixed uuid; slide sets replaced only when changed). No web/API rebuild involved |

### Non-functional requirements

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Runnable app, not a static demo | Done | Clean-clone rehearsal passed: clone → `pnpm install` → `pnpm bootstrap` → `pnpm dev` → live curls → `pnpm test` 117/117 (log in phase-07 report) |
| 2 | Stack declared | Done | README tech-stack table with per-choice rationale + version-pinning rationale |
| 3 | API structure + data model documented | Done | [API.md](./API.md) — all 10 endpoints, real outputs, data model, status-code table |
| 4 | Template storage/distribution mechanism | Done | Committed `seed-assets/` mirrored to gitignored `storage/` by idempotent `pnpm bootstrap`; templates distributed as real OOXML files, metadata in SQLite |
| 5 | Copy without mutating the original | Done | sha256 checksums before/after full use-edit-export flows — identical (e2e suites + live session; same template checksum `c4754ccde…974c` reproduced from a fresh clone as in phase-04a report, proving committed seed determinism) |
| 6 | Error handling + tests of key flows | Done | 117 tests (65 unit + 52 e2e): filter matrix, copy-on-use checksums, export→mammoth round-trip, 20-case traversal matrix, real 429 throttle, helmet headers, DTO junk-field rejection, 413 transport cap |
| 7 | Third-party libraries + licenses declared | Done | License table below (generated via `pnpm -r licenses list`, curated); no GPL/AGPL-only runtime dependency |
| 8 | Extensibility to other office types | Done | `OfficeHandler` strategy seam + `OfficeHandlerRegistry` (501 contract for unimplemented kinds); adding PPTX cost one handler file + one registration line with **zero diff** in `documents.controller.ts` and DTOs (`git diff b3afcfe..db9d55b`) |
| 9 | AI-assisted coding disclosure | Done | Section below |
| 10 | Install/run guide | Done | README quickstart, verified by the clean-clone rehearsal; `bootstrap` (not `setup`) naming explained |
| 11 | README with architecture | Done | ASCII diagram synced to actual code; data-flow section; repository layout |
| 12 | API documentation | Done | API.md with copy-pasted real outputs |
| 13 | Seed data | Done | 9 templates / 16 slide previews seeded by `pnpm bootstrap` (fixed uuids, rerun-safe) |
| 14 | Screen recording | Not done (placeholder) | Placeholder above; 3-minute outline below — recording pending |
| 15 | Done/not-done list | Done | This matrix |

## Limitations and future paths

Each limitation: what is missing, why, and the path forward.

### L1 — No authentication / authorization

**Why:** deliberate scope decision for a single-user local exercise; adding auth (sessions or
JWT) would add surface without changing the evaluated core flows.
**Future path:** NestJS Passport/JWT guard on the API + a route guard in the SPA; both
`Template` and `Document` would gain an `ownerId`.

### L2 — No in-browser PPTX editing (and no live deck render)

PPTX documents are file-based: the copy is downloaded and edited in the user's own presentation
app. There is no in-browser deck editor, and the attempted live in-browser render is blocked by
a **root-caused third-party defect pair** (full story below).
**Future path:** embed OnlyOffice Document Server or Collabora Online (both support PPTX
viewing + editing). Note: both are **AGPL / dual-licensed (commercial)** — a licensing decision
(self-hosting, or a commercial agreement) belongs to the product owner, not a quick code patch.

### L3 — DOCX fidelity: cosmetics lost in the HTML round-trip

mammoth maps DOCX → semantic HTML only. Preserved through ingest → edit → export (all verified
by e2e + real-browser checks): headings h1–h3, bold, italic, underline, bullet/ordered lists,
tables (structure), inline images. Dropped: text alignment, colors, font sizes, table cosmetics
(borders/shading/margins).
**Why:** mammoth is deliberately semantic — it intentionally discards visual styling; replacing
it means a style-preserving converter.
**Future path:** a style-aware DOCX↔HTML converter (e.g. a custom translator over the OOXML
XML DOM, or a commercial SDK) if visual fidelity becomes a requirement.

### L4 — PPTX previews are committed SVGs, not live renders

Shipped preview UX: deterministic per-slide SVG previews (same visual in modal and document
page). A live in-browser render via `pptx-preview@1.0.7` was attempted and **blocked by a
root-caused defect pair, both in third-party libraries at their latest published versions**:

1. **pptxgenjs 4.0.1** emits `[Content_Types].xml` Override entries for
   `slideMaster2..N.xml` — one per slide — but writes only `slideMaster1.xml` into the package
   ("ghost overrides"). Reproduced with a minimal 2-slide deck.
2. **pptx-preview 1.0.7** discovers parts by iterating those Overrides and reads each part
   **unguarded**; the first missing part throws, its blanket `try/catch` swallows the error,
   and the slide/layout loops never execute → empty render.

Verdict: our decks' OOXML relationship chains are fully valid (presentation ↔ master ↔ layout ↔
slides verified) — the defect pair made an empty render, not an invalid file. The downloaded
PPTX is a byte-identical copy of the generator output and `unzip -t` clean. (No presentation
application on the build machine, so "opens in PowerPoint" was not demonstrated — see the P2 #5
matrix row. Files are verified as: valid OOXML structure, byte-identical copy, `unzip -t` clean.
pptxgenjs documents its output as PowerPoint-compatible OOXML; **not demonstrated here**).
**Future path:** wait for upstream fixes (or patch/workaround at runtime — rejected as
complexity for a take-home); or OnlyOffice/Collabora (L2) which renders independently of
pptx-preview; or post-process the deck in the generator (rejected: risks byte-determinism of
committed seed assets).

### L5 — Thumbnails are design-time SVG cards, not file renders

Card thumbnails and slide previews are generated by the same script that writes the office
files — they are **not** runtime conversions of the binaries.
**Why:** integrity by construction — card and file derive from one spec entry, so previews
cannot drift from content; also deterministic (regeneration is byte-identical, sha1-verified)
and keeps the repo free of binary artifacts.
**Future path:** runtime thumbnail rendering (e.g. LibreOffice headless in a worker) if
thumbnails must reflect arbitrary user-uploaded files.

### L6 — No pagination

Template list and document list endpoints return full collections.
**Why:** dataset is 9 templates and a handful of documents; pagination is dead weight (YAGNI).
**Future path:** cursor pagination (`updatedAt` + `id` keyset) when collections grow; the list
DTOs are the only touch points.

### L7 — Single-user local application

One SQLite file, no multi-instance story, no object storage; documents accumulate without a
quota or deletion endpoint.
**Future path:** Postgres + S3-compatible storage behind the same storageKey abstraction when
deploying; a delete endpoint for documents.

## Test and verification summary

- **117 tests, all green**: 65 unit + 52 e2e (`pnpm test`). E2e runs a real HTTP app (helmet,
  ValidationPipe, 2.5 MB body limit mirrored from `main.ts`) against a dedicated
  `storage/test.db`; `dev.db` is checksummed untouched in-suite.
- **Mutation check** on the core immutability oracle: disabling the copy step turned 9 e2e
  tests red (including both TEMPLATE IMMUTABILITY checksum tests) — the tests genuinely pin
  copy-on-use.
- Security verification: 20-case traversal matrix (5 routes × 4 payloads incl. URL-encoded
  `..%2F` — all 400/404 JSON, never 200/500), real 429 via `THROTTLE_LIMIT=30`, helmet header
  assertions, no stack traces leaked.
- A tests-exposed real bug was fixed and is documented in phase-06: Express's default 100 kB
  JSON limit made the DTO's 2 MB `contentHtml` cap unreachable dead code (every >100 kB PATCH
  413'd before validation) — fixed with `bodyParser: false` + `json({ limit: '2.5mb' })`, and
  both layers are now asserted (2,000,001 chars → 400; 3 MB → 413).

## Open-source licenses

Runtime dependencies are all permissively licensed (MIT / Apache-2.0 / BSD / ISC). Generated
with `pnpm -r licenses list` at delivery time; curated to direct dependencies. Full transitive
tree: run `pnpm -r licenses list` (no GPL/AGPL-only package appears anywhere in the tree).

### API (`apps/api`) — runtime

| Package | Version | License | Purpose |
|---|---|---|---|
| @nestjs/common, core, platform-express | 11.2.8 | MIT | Web framework + DI + Express platform |
| @nestjs/config | 4.0.4 | MIT | Env config (`PORT`, `THROTTLE_LIMIT`) |
| @nestjs/serve-static | 5.0.5 | MIT | Serves `/assets` (thumbnails, slide previews) |
| @nestjs/throttler | 6.7.1 | MIT | Global rate limit (429) |
| @prisma/client | 6.19.3 | Apache-2.0 | Type-safe SQLite client |
| class-validator / class-transformer | 0.15.1 / 0.5.1 | MIT | DTO validation + transforms |
| docx | 9.15.0 | MIT | HTML → DOCX export (`docx/html`) |
| helmet | 8.3.0 | MIT | Security headers |
| mammoth | 1.13.0 | BSD-2-Clause | DOCX → HTML ingest/preview |
| reflect-metadata / rxjs | 0.2.2 / 7.8.2 | Apache-2.0 | NestJS runtime prerequisites |

### Web (`apps/web`) — runtime

| Package | Version | License | Purpose |
|---|---|---|---|
| react / react-dom | 19.3.1 | MIT | UI |
| react-router-dom | 7.18.5 | MIT | Routing (`/`, `/documents`, `/documents/:id`, `/documents/:id/edit`) |
| @tiptap/react, starter-kit, extension-table, pm | 3.32.1 | MIT | Rich-text editor (ProseMirror) |
| pptx-preview | 1.0.7 | **ISC** (permissive) | Attempted live deck render (inactive fallback path — see L4) |

### Scripts (`scripts/`) — design-time only, dev dependencies

| Package | Version | License | Purpose |
|---|---|---|---|
| docx | 9.15.0 | MIT | DOCX generator |
| pptxgenjs | 4.0.1 | MIT | PPTX deck generator |
| tsx | 4.23.15 | MIT | TS script runner

**GPL/AGPL statement:** no runtime or dev dependency is GPL/AGPL-licensed. The only package in
the tree whose license string mentions GPL is **jszip** (`(MIT OR GPL-3.0-or-later)`, a
transitive dependency of pptx-preview) — it is **dual-licensed**; this project uses it under its
MIT grant, so it is permissive. Dev toolchain (TypeScript Apache-2.0, Jest/supertest/ts-jest/
Vite/Tailwind MIT, Prisma CLI Apache-2.0) is likewise permissive.

## AI-assisted development disclosure

This project was built with AI assistance (Claude Code): AI was used for research (library
evaluation, licensing, version compatibility), scaffolding, and implementation assistance under
direction. Design decisions (architecture, the strategy seam, scope of features, honest
limitation calls), code review, and verification were human-driven. All claims in this package
are backed by executed verification — clean-clone rehearsal, live curl sessions, and 117
passing tests — not by assumption. This disclosure is made in the interest of transparency.

## Screen recording outline (3 minutes, when recorded)

1. **0:00 Intro** — repo, README quickstart running (`pnpm install && pnpm bootstrap && pnpm dev`), health check.
2. **0:30 Browse** — library grid: 9 cards, thumbnails, categories; search "invoice" (debounced); category + kind filters; empty state, then clear.
3. **1:00 DOCX flow** — open Business Proposal modal (mammoth preview) → Use template → editor: apply bold/underline/H2, add a list, retitle → Save ("Saved" flash) → Download `.docx` → show file present.
4. **1:50 PPTX flow** — Business Pitch modal: slide-strip preview → Use template → document page (6 slide previews, "independent copy" note) → Download `.pptx`.
5. **2:30 Integrity + tests** — show `sha256` of template before/after flows unchanged; run `pnpm test` → 117/117 green; close on the README architecture section.
