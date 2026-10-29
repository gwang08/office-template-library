# Office Template Library

A two-product office application, delivered as a pnpm monorepo:

1. **DOCX template library** — browse, search and filter templates; preview content in-browser;
   "Use template" creates an **independent copy** (the template file is never mutated); edit the
   copy in an integrated rich-text editor; save and download as a real `.docx`.
2. **PPTX template library** — browse decks with per-slide previews; "Use template" creates an
   independent `.pptx` copy you download and edit in any presentation app.

Everything runs locally with zero external services: SQLite file database, committed seed assets,
no network calls after `pnpm install`.

## Quickstart (30 seconds)

Prerequisites: **Node.js >= 20** (LTS recommended), **pnpm >= 10** (pinned via `packageManager`;
corepack handles it).

```bash
pnpm install    # workspace install (first run needs network)
pnpm bootstrap  # create storage/ + .env, apply migrations, seed 9 templates
pnpm dev        # API on :3000, web on :5173
```

Then open **http://localhost:5173**. Verify the API directly:

```bash
curl http://localhost:3000/api/health   # -> {"status":"ok"}
```

> **Why `bootstrap` and not `setup`?** `pnpm setup` is a reserved built-in pnpm command (it
> configures pnpm itself) and will never run a workspace script — so the setup script is named
> `bootstrap`.

`pnpm bootstrap` is idempotent — rerun any time to re-mirror committed `seed-assets/` into
`storage/` and re-seed (rows upsert by fixed uuid). `apps/api/.env` is auto-created from the
committed `apps/api/.env.example`; it contains **only local defaults** (SQLite file path + port,
no secrets).

Other commands:

```bash
pnpm test        # API unit tests (65) + e2e tests (52) — 117 total
pnpm build       # type-check + build api and web
pnpm gen:assets  # regenerate seed-assets/ from scripts/specs/ (design-time)
```

## Architecture

```
 apps/web (Vite + React 19 + Tiptap + Tailwind v4)
   library page · preview modal · docx editor · pptx document page
        │  /api and /assets proxied by Vite dev server
        ▼
 apps/api (NestJS 11, global prefix /api, helmet + rate limit + ValidationPipe)
   ├── templates module ── GET /api/templates[/…], /preview (mammoth)
   ├── documents module ── POST/GET/PATCH /api/documents, /export
   │        └── dispatches by kind through ▼
   ├── office module ── OfficeHandlerRegistry (strategy seam)
   │        ├── DocxHandler  (mammoth ingest · docx/html render)
   │        └── PptxHandler  (byte-for-byte copy · stream back)
   ├── ServeStatic  /assets ◀── storage/assets (SVG thumbnails/slide previews)
   └── Prisma ──────────────────▶ storage/dev.db (SQLite, gitignored)

 storage/  (gitignored, recreated by `pnpm bootstrap`)
   templates/  documents/  assets/  dev.db

 scripts/  (committed generators — design-time only)
   specs/ (9 template specs, fixed uuids)
     └── generate-assets.ts ──▶ seed-assets/  (9 office files + 22 SVG previews + manifest)
```

**The extensibility seam:** every office kind implements one `OfficeHandler` interface
(`createDocumentCopy` + `exportDocument`) and registers in the `OfficeHandlerRegistry`. PPTX
support (phase 5) was added as **one handler file + one registration line** — the documents
controller and DTOs took **zero diff** (`git diff b3afcfe..db9d55b -- documents.controller.ts`
is empty). A future `XlsxHandler` follows the same path.

### Data flow

- **DOCX**: use-template → server copies the template file byte-for-byte to
  `storage/documents/{docId}.docx` (template untouched — checksum-tested in e2e) → mammoth
  extracts HTML (`contentHtml`, single source of truth) → Tiptap edits it → save patches
  `contentHtml` → export renders HTML to a fresh DOCX via `docx/html`.
- **PPTX**: use-template → byte-for-byte copy to `storage/documents/{docId}.pptx`
  (`contentHtml` stays null — the file IS the source of truth) → download exports that copy,
  byte-identical to the template.

## Repository layout

```
apps/api     NestJS 11 + Prisma 6 + SQLite REST API (prefix /api), Jest unit + e2e tests
apps/web     React 19 + Vite 7 + Tailwind v4 SPA, Tiptap editor, react-router v7
scripts      Design-time generators producing the committed seed-assets/ tree
seed-assets  Committed: 9 office files, 6 docx card SVGs, 16 slide SVGs, manifest.json
storage      Runtime state (gitignored) — recreated + seeded by `pnpm bootstrap`
docs         API reference (docs/API.md), delivery package (docs/DELIVERY.md)
```

## Tech stack and why

| Choice | Version (lockfile) | Why this / why this version |
|---|---|---|
| NestJS | 11.2.8 | Modular DI backend that maps cleanly to the domain (templates / documents / office handlers). **Pinned to v11, not v12**: Nest 12 requires Node >= 24; v11 supports the LTS line (20/22/24) this project targets. |
| Prisma + SQLite | 6.19.3 | Typed schema, migrations and seed in one tool; SQLite = zero-service local persistence. **Pinned to v6, not v7**: Prisma 7 requires Node >= 24 and moves config to `prisma.config.ts` (the `package.json#prisma.seed` deprecation warning on v6 is expected). |
| React + Vite | 19.3.1 / 7.3.7 | Fast dev server with built-in proxy for `/api` and `/assets`; no SSR requirements for this product. |
| Tailwind CSS | 4.3.3 | Utility styling with zero theme config (v4 `@tailwindcss/vite` plugin). |
| Tiptap | 3.32.1 | ProseMirror-based editor whose document model round-trips through HTML — the same HTML the API stores in `contentHtml`. |
| mammoth | 1.13.0 | DOCX → HTML for previews and editor ingest (`styleMap: ['u => u']` keeps underlines). |
| docx | **9.15.0 (exact)** | HTML → DOCX export via the young `docx/html` module; pinned exactly because the module is new. Guarded by an e2e export → re-ingest round-trip test. |
| pptxgenjs | 4.0.1 (scripts only) | Generates the seeded decks (design-time only, never imported by the API). |
| pptx-preview | 1.0.7 | Attempted live in-browser deck render; blocked by a root-caused third-party defect pair — the committed per-slide SVGs are the shipped preview. Full story in [docs/DELIVERY.md](docs/DELIVERY.md#limitations-and-future-paths). |
| helmet + @nestjs/throttler | 8.3.0 / 6.7.1 | Secure headers (CSP, nosniff, frameguard…) and 100 req/min rate limit (429 verified in e2e via `THROTTLE_LIMIT` env override). |
| class-validator | 0.15.1 | DTO validation (`whitelist` + `forbidNonWhitelisted` → junk fields 400; traversal-shaped ids never reach the FS — ParseUUIDPipe rejects them). |
| Jest + supertest | 29.7.0 / 7.3.1 | Unit specs co-located with source; e2e specs run a real HTTP app against a separate `storage/test.db` (dev.db is checksummed untouched in-suite). |

## Adding a new template (no UI or API changes)

The library is data-driven: a template is one spec entry in `scripts/specs/`.

1. Append a `DocSpec` (or `DeckSpec`) entry to the relevant spec file — e.g.
   `scripts/specs/docx-specs-personal.ts`. Give it a fresh fixed uuid, a `slug`, `name`,
   `description`, `category`, `palette` and content `blocks` (headings, paragraphs with
   bold/italic/underline runs, bullet/numbered lists, tables, inline brand image) — or `slides`
   for a deck. See [scripts/README.md](scripts/README.md) and `scripts/specs/spec-types.ts`.
2. Regenerate committed assets:

   ```bash
   pnpm gen:assets   # writes seed-assets/templates/*.{docx,pptx} + SVG previews + manifest
   ```

3. Seed it:

   ```bash
   pnpm bootstrap    # mirrors seed-assets/ into storage/ and upserts by fixed uuid
   ```

The new template appears in the library grid, search, category filter and preview — zero web or
API code changes. Card/slide SVG previews are generated from the **same spec** that produces the
office file, so previews cannot drift from content.

## Tests

```bash
pnpm test    # unit (65) then e2e (52)
```

- **Unit** — services, handlers, DTO validation, filename slugs, storage-path containment guard.
- **E2E** — real HTTP app (helmet + ValidationPipe + body limit mirrored from `main.ts`) against
  a dedicated `storage/test.db`; each suite re-migrates and re-seeds; `dev.db` is never touched
  (checksummed in-suite).
- Key flows covered: template list/filter matrix, copy-on-use **template-immutability checksums**
  (docx + pptx), export → mammoth round-trip, 20-case path-traversal matrix, a **real 429**
  (`THROTTLE_LIMIT=30` env override), helmet headers, consistent 4xx JSON shape.

## Documentation

- [docs/API.md](docs/API.md) — every endpoint with real request/response examples + data model.
- [docs/DELIVERY.md](docs/DELIVERY.md) — requirement-by-requirement status matrix, honest
  limitations with future paths, OSS license table, AI-assist disclosure.
- [scripts/README.md](scripts/README.md) — how the seed generators and thumbnails work.

## Known limitations (summary)

No authentication (single-user local exercise); DOCX round-trip preserves structure
(headings, bold/italic/underline, lists, tables, images) but not alignment/colors/font sizes;
PPTX previews are committed per-slide SVGs, not live renders (root-caused third-party defect —
see [docs/DELIVERY.md](docs/DELIVERY.md)). Full list with future paths in DELIVERY.md.
