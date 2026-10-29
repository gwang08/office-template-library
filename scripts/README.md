# scripts/ — seed asset generators

Design-time generators that produce the committed `seed-assets/` tree:
6 DOCX + 3 PPTX templates plus SVG thumbnail previews and `manifest.json`.

```bash
pnpm gen:assets        # from repo root (alias for pnpm --filter scripts generate)
```

## How it works

- `specs/` holds the content model (`DocSpec` / `DeckSpec` with fixed uuids).
  **Adding a template = appending one spec entry and rerunning the generator.**
  No UI or API code changes are needed — the library is data-driven.
- `generate-docx-templates.ts` renders specs through `docx@9.15.0` (exact pin).
- `generate-pptx-templates.ts` renders decks through `pptxgenjs@^4.0.1` using
  only text/rect/ellipse/solid fills (no charts or gradients — viewer fidelity).
- `lib/slide-layout.ts` computes one normalized layout per slide, consumed by
  BOTH the pptx writer and the SVG writer, so previews cannot drift from decks.
- `lib/png.ts` encodes the small solid-color inline images (deterministic,
  zero binary assets in the repo).

## Honesty note on thumbnails

Thumbnails are **design-time renders** produced by the same generator that
writes the office files — not runtime conversions of the binaries. Because both
the file and its preview derive from a single spec, they cannot drift apart.
After generating, copy/seed happens via `pnpm bootstrap` (storage mirror +
`prisma db seed` upserts by the fixed uuids — rerun-safe).
