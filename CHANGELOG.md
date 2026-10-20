# Changelog

All notable changes to this starter kit are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); pre-1.0 the project treats **minor** bumps as
features and **patch** bumps as fixes/config.

> **Heads-up for existing projects:** this kit is a _template_, not a dependency. Projects created with
> `pnpm create laravel-react-starterkit` (formerly `laravel-vue-starterkit`) have their `.git` removed and no link back to this repo, so
> updates are **not** automatic. New scaffolds pick up the latest tag; existing projects apply the
> per-release **Upgrading** notes below by hand.

## [Unreleased]

### Changed

- **The SPA is now React instead of Vue (breaking).** `apps/web` is rewritten in React 19:
  - **Routing:** TanStack Router with file-based routes in `apps/web/src/routes/` (route tree generated
    by the Vite plugin). `_app` is the authenticated shell and the single guard — it reads
    `staticData.permission` / `staticData.module` from every matched route; `_guest` is logged-out
    only. The sidebar is derived from `staticData.nav`, replacing the `features/*/routes.ts` glob and
    route `meta`.
  - **State:** TanStack Query (`@tanstack/react-query`) owns all server state, including the session
    user (`userQueryOptions` under `authKeys.user()`, read via `useUser()`). Pinia is removed. A
    401/419 response interceptor in `main.tsx` handles session expiry and CSRF rotation; the axios
    client and Sanctum CSRF flow are unchanged.
  - **Search params** are validated with Valibot (`/login?redirect`, `/reset-password?token&email`).
  - **UI:** `@app/ui` is now shadcn/ui on Base UI (`@base-ui/react`, style `base-nova`) with a
    `@tanstack/react-table` `DataTable`; icons from `lucide-react`. `<Can permission>` replaces the
    `v-can` directive; forms use `FormField` + `formErrors()`.
  - **Tests:** Vitest + React Testing Library; Playwright e2e unchanged in scope.
- **`@app/config`** exports `tsconfig.react.json` (was `tsconfig.vue.json`); the ESLint base uses
  `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`.
- **E-commerce web stub** is laid out as `apps/web/stubs/modules/<m>/routes/_app/**` (moved into
  `src/routes/_app/` by `kit:install`) plus feature folders (moved into `src/features/<m>/`).
- **The scaffolder is renamed** `create-laravel-react-starterkit` (`pnpm create laravel-react-starterkit`)
  and fetches `aivangogh/laravel-react-starterkit` by default.

### Upgrading an existing project

There is no in-place upgrade path from the Vue SPA: scaffold a new project and port your features,
or keep the Vue version. The backend API is unchanged.

## [0.1.1] - 2026-07-07

### Changed

- **The API origin is now env-driven end to end (#69).** A single source of truth lives in
  `backend/.env` as `SERVER_HOST` / `SERVER_PORT`, and `APP_URL` interpolates them. `php artisan serve`
  reads them natively, the Vue SPA derives `VITE_API_URL` from the same file
  (`apps/web/vite.config.ts`), and `pnpm run setup` prints the configured URLs — change the port in one
  place and the server, the SPA, and the setup output all follow, with no code edits.
- **CORS and Sanctum stateful domains derive from env (#69).** `FRONTEND_URL` now accepts a
  comma-separated list of origins (e.g. dev + prod). `config/cors.php` `allowed_origins` and
  `config/sanctum.php` stateful domains are both derived from it (plus `APP_URL` and loopback), so
  there is nothing to hand-sync.
- **The `.env.example` files are self-serve (#69).** A fresh `cp .env.example .env` (backend + web)
  boots green with no manual edits; each knob is documented, and in the monorepo the web app needs no
  `.env` at all.

### Upgrading an existing project (from 0.1.0)

This release is **backward-compatible**: an existing `backend/.env` keeps working because the config
files fall back to sane defaults. To adopt the single-source model:

1. In `backend/.env`, add `SERVER_HOST=localhost` and `SERVER_PORT=8000`, then set
   `APP_URL="http://${SERVER_HOST}:${SERVER_PORT}"` (define `SERVER_*` above `APP_URL` so the
   interpolation resolves).
2. Copy the updated `backend/config/cors.php`, `backend/config/sanctum.php`,
   `apps/web/vite.config.ts`, `apps/web/src/shared/lib/http.ts`, and `scripts/setup.mjs`.
3. You can drop `SANCTUM_STATEFUL_DOMAINS` from `backend/.env` — it is now derived from `FRONTEND_URL`
   + `APP_URL` + loopback. Keep it only for hosts those don't imply. Use a comma-separated
   `FRONTEND_URL` to allow additional SPA origins.
4. In `apps/web` you no longer need a `.env`; the API URL is derived from `backend/.env`. Set
   `VITE_API_URL` only to point at a remote or standalone API.

## [0.1.0] - 2026-07-07

Initial release: Laravel 13 + Vue 3 monorepo starter kit with the
`create-laravel-vue-starterkit` scaffolder, `kit:install` presets (basic / ecommerce), Sanctum +
Fortify SPA cookie auth, Spatie RBAC, Redis caching, a Docker (Postgres + Redis) dev stack with an
SQLite fallback, and Playwright E2E coverage.
