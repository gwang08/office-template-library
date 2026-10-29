# Office Template Library

Two-product office application: a **DOCX template library** with an in-browser editor, and a
**PPTX template library** with preview + download.

- **API** (`apps/api`): NestJS 11 + Prisma 6 + SQLite (REST, prefix `/api`)
- **Web** (`apps/web`): React 19 + Vite 7 + Tailwind CSS v4
- **Scripts** (`scripts/`): office-file generators producing committed `seed-assets/`
- **Storage** (`storage/`): runtime state (SQLite db, templates, documents, thumbnails)

## Version rationale

NestJS 11 + Prisma 6 are pinned intentionally (instead of Nest 12 / Prisma 7) for broad Node LTS
compatibility (Node 20/22/24). Prisma versions are always added with an explicit `^6` range —
the `prisma` npm dist-tag currently points at a release candidate.

## Requirements

- Node.js >= 20 (LTS recommended)
- pnpm >= 10 (version pinned via `packageManager` in `package.json`; corepack-supported)

## Quickstart

```bash
pnpm install   # install workspace deps (first install needs network)
pnpm bootstrap # create storage/ tree + local .env, apply migrations, seed
pnpm dev       # API on :3000, web on :5173 (proxies /api and /assets to the API)
```

> The setup script is named `bootstrap` (not `setup`) because `pnpm setup` is a reserved
> built-in pnpm command that configures pnpm itself and would never run a workspace script.

Other commands:

```bash
pnpm build     # type-check + build api and web
pnpm test      # api unit tests + e2e tests
```

- Health check: `curl http://localhost:3000/api/health` → `{"status":"ok"}`
- Web app: `http://localhost:5173` (shows live API health status)

## Notes

- `apps/api/.env` holds only local defaults (SQLite file path + port, no secrets);
  it is created automatically from the committed `apps/api/.env.example` by
  `pnpm setup` if missing.
- `storage/` is gitignored runtime state; `scripts/bootstrap-storage.mjs` recreates it from
  the committed `seed-assets/` on `pnpm setup`.
- Dependency build scripts are explicitly whitelisted in `pnpm-workspace.yaml`
  (`onlyBuiltDependencies`) — pnpm 10 blocks them by default.
- No authentication is implemented (documented limitation for this exercise).
