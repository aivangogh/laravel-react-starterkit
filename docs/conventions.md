# Conventions

Project-wide rules. Most are encoded in tooling (`.editorconfig`, ESLint, Pint) —
this captures the ones tooling can't enforce.

## Formatting & style

`.editorconfig` is authoritative:

| | |
| --- | --- |
| Charset | UTF-8 |
| Line endings | LF |
| Final newline | yes |
| Trim trailing whitespace | yes (except `.md`) |
| Default indent | 2 spaces |
| PHP / Blade | 4 spaces |
| YAML | 2 spaces |
| `composer.json` | 4 spaces |

Formatters:

- **JS / TS / Vue / CSS / JSON** — Prettier (`pnpm format`).
- **PHP** — Laravel Pint (`./vendor/bin/pint` from `backend/`).

Linters:

- **JS / TS / Vue** — `oxlint --fix` (fast) → `eslint --fix --cache` (richer).
- **PHP** — Pint covers style; add PHPStan/Larastan if/when introduced.

Run from root with `pnpm lint` and `pnpm format`. Don't fight the formatter.

## Package manager

- **pnpm** is pinned via `packageManager` in the root `package.json`. **Do not** use `npm install` or
  `yarn install` at the repo root — it produces a wrong/partial lockfile.
- The Laravel backend may use `npm` from inside `backend/` for its Vite tooling only.

## Workspace boundaries

- `pnpm-workspace.yaml` covers `apps/*` and `packages/*`. `backend/` is **deliberately excluded** — it
  has its own toolchain.
- Don't add Node deps to `backend/package.json` for non-Vite reasons. Share code with the backend via
  a Composer extension or the HTTP boundary, not the JS workspace.

## Naming

- Shared packages use the `@app/*` scope: `@app/ui`, `@app/types`, `@app/config`.
- The web app is the unscoped package `web` (`pnpm --filter web ...`).
- When cloning this kit for a real project, find-and-replace `@app/` with your own scope.

## Shared types

- Frontend ↔ backend types live in `packages/types`. Hand-authored → `src/index.ts`; generated →
  `src/generated/` (re-exported).
- Don't duplicate types in `apps/web` or in `backend/`. Lift shared types into `@app/types`.

## Vue conventions

- `<script setup lang="ts">` SFCs only — Composition API. No Options API.
- Client state → Pinia stores (setup-style), co-located with the owning feature. Server data → TanStack
  Query composables, never Pinia.
- Reusable UI → `@app/ui`, not `apps/web/src/components`. App-specific composition stays in the app.
- Use the `cn()` helper from `@app/ui/lib/utils` for conditional classes.
- API calls go through `@/shared/lib/http` inside Query composables — never `axios`/`http` directly in
  a `.vue` component.

## Laravel conventions

- Use the **`casts()` method** form for Eloquent casts (already in `App\Models\User`). Don't use the
  `protected $casts = []` array form.
- Use **`$fillable`** (allowlist) — never `$guarded = []`.
- Migrations are append-only in shared environments. Locally, `migrate:fresh` is fine.
- Factories live in `database/factories/`. **Pest** is the intended test runner; format with **Pint**.
- Controllers return **API Resources**; validate with **FormRequests**; enforce authorization with
  Spatie `permission:` / `role:` middleware.

## Environment files

- Real `.env` files are gitignored. Each app/service ships its own `.env.example`.
- `backend/.env` is the **single source of truth** for DB and Redis credentials — `docker-compose.yml`
  reads it directly. Don't duplicate those keys elsewhere.

## Tests

- FE unit/component: Vitest, co-located per feature under `apps/web/src/features/<x>/__tests__/`.
- FE e2e: Playwright in `apps/web/e2e/`.
- Backend: Pest in `backend/tests/{Feature,Unit}/`.
- Don't mock around real boundaries — hit the real Postgres/Redis from feature tests.

## When in doubt

- Match existing code in the same area before introducing a new pattern.
- Prefer workspace scripts (`pnpm dev`, `pnpm lint`, `composer test`) over poking sub-packages.
- Add shared code to `packages/*` only when **two or more apps** need it. Don't pre-extract.
