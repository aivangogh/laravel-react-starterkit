# Architecture

A bird's-eye view of how the pieces fit together. Read [getting-started.md](./getting-started.md)
first if you haven't run the stack yet.

## High-level shape

```
            ┌──────────────────────────┐
            │   apps/web  (Vue 3 SPA)  │
            │  Vite · Pinia · Router   │
            │  TanStack Query          │
            │  Tailwind 4 · shadcn-vue │
            └──────────┬───────────────┘
                       │   HTTP/JSON  (Sanctum cookie auth)
                       ▼
            ┌──────────────────────────┐
            │   backend/  (Laravel 13) │
            │  PHP 8.4 · API + queue   │
            │  Sanctum · Fortify       │
            └─────┬──────────────┬─────┘
                  │              │
                  ▼              ▼
            ┌──────────┐   ┌──────────┐
            │ Postgres │   │  Redis   │
            │   17     │   │   7      │
            └──────────┘   └──────────┘
```

The web app is a separately-deployed SPA that talks to the Laravel API over HTTP. The two share a
typed contract via `packages/types` (`@app/types`).

> **Data stack:** the backend runs on **Postgres 17 + Redis 7 via Docker** (Phase 1; `predis`
> client). See [local-stack.md](./local-stack.md).

## Component responsibilities

### `apps/web` — Vue 3 SPA

- Renders all UI; owns **client-side** state via Pinia and routing via Vue Router.
- Owns **server-side** state via TanStack Query (`@tanstack/vue-query`) — not Pinia.
- Imports the design system from `@app/ui` (Vite path alias → `packages/ui/src`).
- Talks to the Laravel API through a single Axios instance; types responses against `@app/types`.
- Lints with **oxlint** (fast) → **eslint** (richer); formats with Prettier.
- Tests: **Vitest** (unit/component), **Playwright** (e2e).

See [frontend.md](./frontend.md).

### `backend/` — Laravel 13 API

- HTTP API, queue workers, scheduled jobs. PHP 8.4.
- Auth via **Sanctum** (SPA cookie sessions + API tokens) and **Fortify** (headless auth actions).
- Authorization via **Spatie Permission**; auditing via **Spatie Activitylog**; uploads via
  **Spatie MediaLibrary**; settings via **Spatie Settings**.
- Persistence: Postgres (target); cache/queue/session/broadcast: Redis (target).
- **Not a pnpm workspace member** — managed entirely via Composer + `php artisan`.

See [backend.md](./backend.md).

### `packages/types` — shared TS contract (`@app/types`)

The interface between FE and BE. Two flavours:

- **Hand-authored** types in `src/index.ts` (e.g. `Uuid`, `IsoDateTime`, `Paginated<T>`, `ApiError`).
- **Generated** types in `src/generated/` — emitted from a Laravel-side generator
  (e.g. `spatie/laravel-typescript-transformer`). Do not hand-edit; re-export from `index.ts`.

### `packages/ui` — shared design system (`@app/ui`)

- Source-only package — consumed via the `@app/ui` path alias, never built.
- Houses **shadcn-vue** components (style `new-york`, base `neutral`, icons `lucide`).
- Add components with `pnpm --filter @app/ui ui:add <name>`.

### `packages/config` — shared config bases (`@app/config`)

- Exports `eslint`, `prettier`, and `tsconfig` bases consumed by apps and packages so style stays
  consistent across the monorepo.

## Data layer (target)

- **Postgres 17** with extensions enabled at first init (`docker/postgres/init/`): `pgcrypto`,
  `uuid-ossp`, `citext`, `pg_trgm`, etc.
- **Redis 7** for Laravel cache / queue / session / broadcast.

Both are **dev-tuned** — see [local-stack.md](./local-stack.md) for prod differences.

## Workspace boundaries

`pnpm-workspace.yaml` covers only `apps/*` and `packages/*`. The Laravel backend is intentionally
outside the workspace:

- It has its own dependency graph (Composer) and toolchain (`php artisan`, `composer test`).
- The boundary keeps Node/PHP concerns from leaking into each other.
- Cross-cutting types live in `@app/types` so neither side reaches into the other's source tree.

## Auth, authz, auditing

- **Auth** — Fortify performs auth actions (register/login/2FA/reset); Sanctum maintains the SPA
  session via cookies. See [backend.md](./backend.md) and the flow in [frontend.md](./frontend.md).
- **Authorization** — Spatie Permission; the API enforces `permission:`/`role:` middleware, the SPA
  mirrors permissions returned by `/api/user`. See [rbac.md](./rbac.md).
- **Auditing** — Spatie Activitylog records model changes, surfaced via a read-only API + screen.
  See [activity-log.md](./activity-log.md).

## Presets & modules

A planned `php artisan kit:install` selects a **Basic** or **E-commerce** preset and toggles
optional features, copying only the chosen module stubs into both `backend/` and `apps/web`. See
[modules.md](./modules.md).
