# End-to-end tests (Playwright)

These specs drive the real SPA against the **live stack** — Vite, the Laravel API, and
Postgres/Redis — so they exercise the genuine Sanctum cookie session end to end. Nothing is mocked.

Everything runs against `http://localhost` (never `127.0.0.1`): the session cookie is scoped to
`localhost` (`SESSION_DOMAIN=localhost`), so the API must be reached there too.

## Prerequisites

From the repo root:

```bash
pnpm db:up                                            # Postgres (5434) + Redis (6381)
cd backend && php artisan migrate:fresh --seed        # seeds the super-admin: admin@example.com / password
cd backend && php artisan serve --host=localhost --port=8000   # API on localhost:8000 (PHP 8.4)
```

> The backend runs on **PHP 8.4** — see `.claude/skills/php-84-runtime`. Put 8.4 on `PATH` before
> `php artisan …` or Composer resolves the wrong majors.

The Vite dev server is started automatically by Playwright's `webServer` (an already-running one is
reused). Install the Chromium browser once with `npx playwright install chromium`.

## Run

```bash
pnpm test:e2e                     # from repo root, or from apps/web
pnpm --filter web exec playwright test auth.spec.ts   # a single spec
pnpm --filter web exec playwright test --ui           # interactive UI mode
```

## What's covered

| Spec | Verifies |
| --- | --- |
| `auth.spec.ts` | Guest redirect, register, login, invalid credentials, logout, guest-only guard |
| `rbac.spec.ts` | Super-admin sees/reaches everything; a no-permission user is redirected to `/forbidden` and gated nav is hidden |
| `users-crud.spec.ts` | Full create → edit → delete round-trip through the users DataTable |
| `activity.spec.ts` | A user action produces an activity-log entry |
| `feature-smoke.spec.ts` | Every base-preset page renders for the super-admin |

Shared login/register/create helpers live in `helpers.ts`. Tests use unique emails
(`uniqueEmail()`), so they are idempotent across reruns and safe under parallel workers on a shared
database.

E-commerce flows are **not** covered here: on a Basic install the module stub is not published, so
there are no e-commerce routes to drive. The e-commerce module is verified at the test-suite level
(`composer test` + `pnpm test:unit`); the live installer round-trip is a Phase 9 deliverable
(see `docs/roadmap.md`).
