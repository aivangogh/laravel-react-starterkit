# Documentation

Documentation for the Laravel + React decoupled starter kit. The architecture is a pnpm-workspace
monorepo with `apps/web` + `packages/*`, and a Laravel backend kept outside the workspace.

## Current status

- ✅ **Backend basic installation complete** — Laravel 13.17; Sanctum, Fortify, and the four Spatie
  packages installed, published, and migrated on PHP 8.4.22.
- ✅ **Monorepo shell scaffolded (Phase 0)** — `pnpm-workspace.yaml`, root `package.json`, and
  `packages/{config,types,ui}` (`@app/*`) installed and type-checking green.
- ✅ **Local stack + backend wiring (Phase 1)** — Docker **Postgres 17 + Redis 7** (`predis`),
  `User` traits, headless Fortify, Sanctum SPA cookie auth + CORS, Spatie middleware aliases.
  **Verified end-to-end** (CSRF → register → authenticated `/api/user`).
- ✅ **`apps/web` SPA, base API, `kit:install` presets and the e-commerce module** are built; the SPA
  is being ported from Vue 3 to React 19 (Phase 10). See [roadmap.md](roadmap.md).

## Index

| Doc | What it covers |
|---|---|
| [getting-started.md](getting-started.md) | Zero-to-running: prerequisites, pnpm install, Docker DB, backend setup, run the web app |
| [architecture.md](architecture.md) | Bird's-eye view: monorepo shape, component responsibilities, workspace boundaries |
| [frontend.md](frontend.md) | `apps/web` — stack, feature-based layout, path aliases, state (TanStack Query), file-based routing, testing |
| [backend.md](backend.md) | `backend/` — Laravel 13 API, installed packages, auth model, conventions |
| [packages.md](packages.md) | `packages/*` — `@app/config`, `@app/types`, `@app/ui` |
| [local-stack.md](local-stack.md) | Docker Postgres 17 + Redis 7 dev stack |
| [conventions.md](conventions.md) | Project-wide rules tooling can't fully enforce |
| [rbac.md](rbac.md) | Spatie Permission — install state + wiring steps |
| [activity-log.md](activity-log.md) | Spatie Activitylog — install state + usage |
| [modules.md](modules.md) | The planned `kit:install` preset/installer system |
| [installer.md](installer.md) | The planned one-command installer (`pnpm create laravel-react-starterkit`) + `pnpm setup` orchestrator |
| [roadmap.md](roadmap.md) | Ordered list of everything left to build |

## Conventions for these docs

- **Naming:** shared packages use the `@app/*` scope (`@app/ui`, `@app/types`, `@app/config`).
  The web app is the unscoped workspace package `web` (`pnpm --filter web ...`).
- **Package manager:** **pnpm** at the repo root. Never `npm install` at the root.
- **Backend** is a sibling of the workspace, not a member — managed via Composer + `php artisan`.
- This project **requires PHP 8.4** — see [getting-started.md](getting-started.md) for the
  PHP-version gotcha on this machine.
