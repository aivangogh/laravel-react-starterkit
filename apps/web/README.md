# `web` — Vue 3 SPA

The decoupled frontend for the starter kit. Vue 3 + Vite, Pinia (client state) + TanStack Query
(server state), Vue Router, Tailwind v4, and shadcn-vue primitives consumed from `@app/ui`.

## Setup

```bash
cp .env.example .env        # then adjust VITE_API_URL if the API runs elsewhere
pnpm install                # from the repo root
pnpm --filter web dev       # http://localhost:5173
```

`VITE_API_URL` points at the Laravel API host root (default `http://localhost:8001`). Fortify auth
routes live at the root (`POST /login`, `/register`, ...) and the JSON API under `/api`.

> **Cookies:** serve the SPA against `http://localhost` (never `127.0.0.1`). Sanctum session cookies
> are scoped to `SESSION_DOMAIN=localhost`; add any new SPA origin to the API's
> `SANCTUM_STATEFUL_DOMAINS` and `config/cors.php`.

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
