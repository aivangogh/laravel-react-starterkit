# `web` — Vue 3 SPA

The decoupled frontend for the starter kit. Vue 3 + Vite, Pinia (client state) + TanStack Query
(server state), Vue Router, Tailwind v4, and shadcn-vue primitives consumed from `@app/ui`.

## Setup

```bash
pnpm install                # from the repo root
pnpm --filter web dev       # http://localhost:5174
```

No `.env` needed to start: `vite.config.ts` derives `VITE_API_URL` from the API's single source of
truth in `backend/.env` (`SERVER_HOST`/`SERVER_PORT`), so the SPA follows the backend port. Copy
`.env.example` → `.env` and set `VITE_API_URL` only to override that (e.g. a standalone build, or a
remote API). Fortify auth routes live at the root (`POST /login`, `/register`, ...) and the JSON API
under `/api`.

> **Cookies:** serve the SPA against `http://localhost` (never `127.0.0.1`). Sanctum session cookies
> are scoped to `SESSION_DOMAIN=localhost`. New SPA origins just need adding to `FRONTEND_URL` in
> `backend/.env` (comma-separated) — CORS and Sanctum's stateful domains both derive from it.

## Layout

Organized by feature: `src/app` (bootstrap), `src/shared` (cross-feature primitives — http client,
query client/keys, permissions, `v-can`), `src/features/<f>` (self-contained features). Reusable UI
lives in `@app/ui`, never here.

## Scripts

| Script                         | What                                        |
| ------------------------------ | ------------------------------------------- |
| `pnpm --filter web dev`        | Vite dev server                             |
| `pnpm --filter web build`      | `vue-tsc --noEmit` then `vite build`        |
| `pnpm --filter web type-check` | `vue-tsc --noEmit`                          |
| `pnpm --filter web lint`       | ESLint (shared flat config)                 |
| `pnpm --filter web format`     | Prettier                                    |
| `pnpm --filter web test:unit`  | Vitest (jsdom)                              |
| `pnpm --filter web test:e2e`   | Playwright (requires the API + SPA running) |

## Adding UI components

shadcn-vue primitives land in `@app/ui`, not here:

```bash
pnpm --filter @app/ui ui:add button input label card alert
```
