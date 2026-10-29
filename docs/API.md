# API Reference

REST API served by `apps/api` (NestJS 11) under the global prefix **`/api`** on port 3000.
All request/response bodies are JSON except the three file endpoints, which stream OOXML bytes.

Every example below was executed against a running dev server on a fresh clone
(`pnpm install && pnpm bootstrap && pnpm dev`) — outputs are pasted verbatim.

**Conventions**

- Validation is a global `ValidationPipe` with `whitelist: true`, `transform: true`,
  `forbidNonWhitelisted: true` — unknown body fields are rejected with 400, not ignored.
- Every path `:id` is guarded by `ParseUUIDPipe`: a non-uuid (including URL-encoded traversal
  payloads like `..%2F..%2Fetc%2Fpasswd`) is rejected **400** before any service or filesystem
  code runs.
- All error responses share the shape `{ "message": string | string[], "error": string,
  "statusCode": number }` (the two transport-level exceptions — 413 and 429 — carry
  `{ statusCode, message }` only).
- Security middleware: `helmet` headers on every response; global rate limit of **100
  requests / 60 s** (`THROTTLE_LIMIT` env can override for tests) → 429 beyond it.

---

## Endpoints

### `GET /api/health`

Liveness + DB wiring proof (executes `SELECT 1` against SQLite).

```bash
curl -s http://localhost:3000/api/health
```

```json
{"status":"ok"}
```

---

## Templates

### `GET /api/templates`

List templates, name-ascending. Query parameters (all optional, combinable; an empty value like
`?kind=` is treated as "not provided"):

| Param | Type | Constraints | Behavior |
|---|---|---|---|
| `search` | string ≤ 120 | — | Case-insensitive `contains` on `name` OR `description` (SQLite `LIKE` semantics) |
| `category` | string ≤ 60 | — | Exact match; seeded categories: `Business`, `Finance`, `Personal`, `Education` |
| `kind` | enum | `docx` \| `pptx` | Exact match; anything else → 400 |

```bash
curl -s http://localhost:3000/api/templates
```

```json
[
  {"id":"77777777-7777-4777-8777-777777777777","name":"Business Pitch","description":"Six-slide investor pitch: problem, solution, market, model and ask.","category":"Business","kind":"pptx","thumbnailKey":"assets/thumbs/business-pitch/slide-01.svg","slideCount":6},
  {"id":"11111111-1111-4111-8111-111111111111","name":"Business Proposal","description":"Structured services proposal with executive summary, approach, tiered pricing table and next steps.","category":"Business","kind":"docx","thumbnailKey":"assets/thumbs/business-proposal/card.svg","slideCount":0},
  {"id":"55555555-5555-4555-8555-555555555555","name":"Cover Letter","description":"One-page application cover letter with emphasis formatting and a strengths summary.","category":"Personal","kind":"docx","thumbnailKey":"assets/thumbs/cover-letter/card.svg","slideCount":0}
  // … 9 items total (6 docx + 3 pptx), name-ascending
]
```

Combined filter — real output:

```bash
curl -s "http://localhost:3000/api/templates?search=invoice&kind=docx"
```

```json
[{"id":"44444444-4444-4444-8444-444444444444","name":"Invoice","description":"Clean service invoice with line-item table, totals and payment instructions.","category":"Finance","kind":"docx","thumbnailKey":"assets/thumbs/invoice/card.svg","slideCount":0}]
```

Invalid kind — real output:

```bash
curl -s "http://localhost:3000/api/templates?kind=xyz"
```

```json
{"message":["kind must be one of: docx, pptx"],"error":"Bad Request","statusCode":400}
```

### `GET /api/templates/:id`

Template detail including ordered slide previews (docx templates have `slides: []`).

```bash
curl -s http://localhost:3000/api/templates/77777777-7777-4777-8777-777777777777
```

```json
{
  "id": "77777777-7777-4777-8777-777777777777",
  "name": "Business Pitch",
  "description": "Six-slide investor pitch: problem, solution, market, model and ask.",
  "category": "Business",
  "kind": "pptx",
  "thumbnailKey": "assets/thumbs/business-pitch/slide-01.svg",
  "slides": [
    {"order": 1, "title": "NorthPeak Analytics", "previewKey": "assets/thumbs/business-pitch/slide-01.svg"},
    {"order": 2, "title": "The Problem", "previewKey": "assets/thumbs/business-pitch/slide-02.svg"},
    {"order": 3, "title": "Our Solution", "previewKey": "assets/thumbs/business-pitch/slide-03.svg"},
    {"order": 4, "title": "Market Opportunity", "previewKey": "assets/thumbs/business-pitch/slide-04.svg"},
    {"order": 5, "title": "Business Model", "previewKey": "assets/thumbs/business-pitch/slide-05.svg"},
    {"order": 6, "title": "Raising $6M Series A", "previewKey": "assets/thumbs/business-pitch/slide-06.svg"}
  ]
}
```

| Errors | When |
|---|---|
| `404` | Unknown uuid |

```json
{"message":"Template 00000000-0000-4000-8000-000000000000 not found","error":"Not Found","statusCode":404}
```

| Errors | When |
|---|---|
| `400` | Malformed / traversal-shaped id (`ParseUUIDPipe`) |

```json
{"message":"Validation failed (uuid is expected)","error":"Bad Request","statusCode":400}
```

### `GET /api/templates/:id/preview`

DOCX-only in-browser preview: mammoth converts the template file to HTML
(`styleMap: ['u => u']` preserves underlines). Inline images are embedded as data URIs.

```bash
curl -s http://localhost:3000/api/templates/44444444-4444-4444-8444-444444444444/preview
```

```json
{
  "html": "<h1>Invoice INV-2026-0142</h1><p>From: <strong>Studio Lumen LLC</strong> · 48 Harbor Lane, …",
  "messages": []
}
```

| Errors | When |
|---|---|
| `400` | Template is not docx |
| `404` | Unknown id, or file missing in storage |

```bash
curl -s http://localhost:3000/api/templates/77777777-7777-4777-8777-777777777777/preview
```

```json
{"message":"Preview is only available for docx templates (kind: pptx)","error":"Bad Request","statusCode":400}
```

### `GET /api/templates/:id/file`

Download/stream the template file itself. `Content-Disposition: inline` with the stored file
name; OOXML `Content-Type` per kind. Served via `StreamableFile`.

```bash
curl -s -D - -o business-pitch.pptx http://localhost:3000/api/templates/77777777-7777-4777-8777-777777777777/file
```

```
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: inline; filename="business-pitch.pptx"
```

The streamed bytes are the exact stored template file — sha256 of the response equals the
sha256 of `storage/templates/business-pitch.pptx` (verified in the same session the example was
captured). Errors: `404` unknown id / missing file.

---

## Documents

Documents are **independent copies** of templates (copy-on-use). A document's `kind` is fixed at
creation from its template; the original template file is never written to.

### `POST /api/documents`

Create a document from a template. This is the only client input into the flow: document id and
storage key are server-generated (`storage/documents/{docId}.{kind}`).

Body: `{ "templateId": "<uuid>" }`

```bash
curl -s -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"templateId":"77777777-7777-4777-8777-777777777777"}'
```

```json
{
  "id": "b32deff9-65f3-4860-a913-f3257cdda94a",
  "title": "Business Pitch",
  "kind": "pptx",
  "templateName": "Business Pitch",
  "updatedAt": "2026-10-29T17:20:01.011Z",
  "contentHtml": null,
  "createdAt": "2026-10-29T17:20:01.011Z"
}
```

Returns **201**. For `docx` templates the response additionally carries `contentHtml` populated
by mammoth (the editor's starting content); for `pptx` it is `null`.

| Errors | When |
|---|---|
| `400` | Malformed body (non-uuid `templateId`, extra fields) |
| `404` | Unknown `templateId` |

### `GET /api/documents`

List documents, `updatedAt` descending.

```json
[
  {
    "id": "ccf96cab-870c-47d1-864d-85e42358f423",
    "title": "Q3 Proposal — Edited",
    "kind": "docx",
    "templateName": "Business Proposal",
    "updatedAt": "2026-10-29T17:20:10.236Z"
  }
  // …
]
```

### `GET /api/documents/:id`

Document detail — the list item shape plus `contentHtml` (null for pptx) and `createdAt`.
Errors: `404` unknown id, `400` malformed id.

### `PATCH /api/documents/:id`

Strictly partial update: only fields present in the body are written (a title-only PATCH does
not clobber `contentHtml`).

| Field | Type | Constraints |
|---|---|---|
| `title` | string ≤ 200 | any document |
| `contentHtml` | string ≤ 2,000,000 | **docx documents only** — 400 on pptx |

```bash
curl -s -X PATCH http://localhost:3000/api/documents/ccf96cab-870c-47d1-864d-85e42358f423 \
  -H "Content-Type: application/json" \
  -d '{"title":"Q3 Proposal — Edited","contentHtml":"<h2>Edited Section</h2><p>Some <strong>bold</strong>, <em>italic</em> and <u>underlined</u> text.</p><ol><li>first</li><li>second</li></ol>"}'
```

```json
{
  "id": "ccf96cab-870c-47d1-864d-85e42358f423",
  "title": "Q3 Proposal — Edited",
  "kind": "docx",
  "templateName": "Business Proposal",
  "updatedAt": "2026-10-29T17:20:10.236Z",
  "contentHtml": "<h2>Edited Section</h2><p>Some <strong>bold</strong>, <em>italic</em> and <u>underlined</u> text.</p><ol><li>first</li><li>second</li></ol>",
  "createdAt": "2026-10-29T17:20:00.999Z"
}
```

Guard — real output (`contentHtml` on a pptx document):

```json
{"message":"contentHtml applies to docx documents only (kind: pptx)","error":"Bad Request","statusCode":400}
```

Non-whitelisted field — real output:

```json
{"message":["property hacker should not exist"],"error":"Bad Request","statusCode":400}
```

Errors: `400` (validation, pptx contentHtml, title > 200 chars, contentHtml > 2M chars), `404`
unknown id.

### `GET /api/documents/:id/export`

Export the document as its office file: `attachment` disposition with an ascii slug of the
title as filename — header-injection safe by construction.

- **docx**: editor HTML is rendered into a fresh DOCX via `docx/html`.
- **pptx**: the stored copy is streamed back — the export is byte-identical to the template.

```bash
curl -s -D - -o export.pptx http://localhost:3000/api/documents/b32deff9-65f3-4860-a913-f3257cdda94a/export
```

```
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: attachment; filename="business-pitch.pptx"
```

```bash
curl -s -D - -o export.docx http://localhost:3000/api/documents/ccf96cab-870c-47d1-864d-85e42358f423/export
```

```
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="q3-proposal-edited.docx"
```

(The title contained an em-dash; the slug strips non-ascii. Re-ingesting the exported docx with
mammoth returns the edited HTML structure — headings, bold, italic, underline and ordered list
all verified in the e2e suite.)

Errors: `404` unknown id.

---

## Status codes

| Code | Observed in this API | Example |
|---|---|---|
| `400 Bad Request` | DTO validation (junk field, bad enum, oversize field), `ParseUUIDPipe` on any `:id` (traversal payloads die here), `contentHtml` on a pptx document, pptx `/preview` | `{"message":["property hacker should not exist"],"error":"Bad Request","statusCode":400}` |
| `404 Not Found` | Unknown template/document id; template file missing in storage | `{"message":"Template … not found","error":"Not Found","statusCode":404}` |
| `413 Payload Too Large` | JSON body > 2.5 MB (transport DoS cap, `main.ts`) — sits above the 2M-char DTO caps | `{"statusCode":413,"message":"request entity too large"}` |
| `429 Too Many Requests` | Global rate limit: > 100 requests / 60 s (default; `THROTTLE_LIMIT` env override used by the e2e suite to test it with 30) | `{"statusCode":429,"message":"ThrottlerException: Too Many Requests"}` — observed live at request #101 against the default limit |
| `501 Not Implemented` | Registry contract: `OfficeHandlerRegistry.getHandler` throws it for a kind with no registered handler. Both seeded kinds (`docx`, `pptx`) have handlers, so it is not reachable through the public API today; the guard exists so an unimplemented future kind fails loudly instead of silently. |
| `500 Internal Server Error` | Seed-data corruption (unknown `kind` on a template/document row), filesystem read failures on export — never a client-input path. |

---

## Data model

Prisma schema: `apps/api/prisma/schema.prisma` (single migration `20261029150916_init`).

### Template

| Column | Type | Notes |
|---|---|---|
| `id` | String (uuid, PK) | Fixed uuid per template, assigned in the spec (seed upserts by it — rerun-safe) |
| `name` | String | Display name (searched) |
| `description` | String | Card/modal description (searched) |
| `category` | String | One of `Business` / `Finance` / `Personal` / `Education` (seeded); free string in schema, category chips derive from data |
| `kind` | String | `"docx"` \| `"pptx"` — **see note below** |
| `storageKey` | String, unique | e.g. `templates/invoice.docx` — resolved under `storage/` by a containment guard (`resolveStorageKey`) |
| `thumbnailKey` | String | e.g. `assets/thumbs/invoice/card.svg` — served at `/assets/...` |
| `createdAt` | DateTime | |
| relations | | `slides TemplateSlide[]`, `documents Document[]` |

### TemplateSlide

| Column | Type | Notes |
|---|---|---|
| `id` | String (uuid, PK) | |
| `templateId` | String (FK → Template, `onDelete: Cascade`) | Deleting a template removes its slides |
| `order` | Int | 1-based display order |
| `title` | String | Slide title |
| `previewKey` | String | `assets/thumbs/<slug>/slide-NN.svg`, served at `/assets/...` |

Index on `templateId`.

### Document

| Column | Type | Notes |
|---|---|---|
| `id` | String (uuid, PK) | Row id == file name: the copy lives at `storage/documents/{id}.{kind}` |
| `templateId` | String (FK → Template) | |
| `kind` | String | Copied from the template at creation; fixed thereafter |
| `title` | String | Initialized from the template name; editable (≤ 200 chars); becomes the export filename slug |
| `storageKey` | String | `documents/{id}.{kind}` |
| `contentHtml` | String?, nullable | **Single source of truth for DOCX content**; null for pptx (file is the source of truth) |
| `createdAt` / `updatedAt` | DateTime | `updatedAt` auto-maintained, drives list ordering |

Index on `templateId`.

### Why `kind` is a String, not an enum

SQLite (the chosen datastore) has **no enforced enum type** — Prisma enums are only supported on
PostgreSQL/MySQL. So `kind` is a plain `String` in the schema and the constraint is enforced in
application code instead, at three layers:

1. **Seed boundary** — specs declare `TemplateKind = 'docx' | 'pptx'` at type level; the
   generator writes only valid values.
2. **DTO boundary** — `TemplateListQueryDto.kind` uses `@IsIn(['docx','pptx'])` (400 on anything
   else, shown above).
3. **Service boundary** — before `kind` enters the typed handler registry,
   `isOfficeKind()` narrows it; an out-of-range value from corrupted seed data is a 500 (data
   corruption), never silently accepted.

The `OfficeHandlerRegistry` is keyed by the union type `OfficeKind`, so TypeScript itself rejects
registering or looking up an unknown kind at compile time.

---

## Static assets

`GET /assets/{path}` — served by `@nestjs/serve-static` from `storage/assets/`
(SVG thumbnails and slide previews). No `/api` prefix; the `renderPath` is constrained to the
`/assets` subtree so static fallback never swallows API 404s.

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:3000/assets/thumbs/invoice/card.svg
```

```
200 image/svg+xml
```
