# `web` — React 19 SPA

The decoupled frontend for the starter kit. React 19 + Vite, TanStack Router (file-based routes),
TanStack Query (all server state, including the session user), Tailwind v4, and shadcn/ui (Base UI)
primitives consumed from `@app/ui`.

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

Organized by feature: `src/main.tsx` + `src/router.tsx` (bootstrap), `src/routes` (file routes —
`_app` is the authenticated shell + guard, `_guest` the logged-out pages; `routeTree.gen.ts` is
generated), `src/shared` (cross-feature primitives — http client, query client/keys, permissions,
`<Can>`, `FormField`), `src/features/<f>` (self-contained features: pages, hooks, components, tests).
Reusable UI lives in `@app/ui`, never here. See [`docs/frontend.md`](../../docs/frontend.md).

## Scripts

| Script                         | What                                        |
| ------------------------------ | ------------------------------------------- |
| `pnpm --filter web dev`        | Vite dev server                             |
| `pnpm --filter web build`      | `vite build` then `tsc --noEmit`            |
| `pnpm --filter web type-check` | `tsc --noEmit`                              |
| `pnpm --filter web lint`       | ESLint (shared flat config)                 |
| `pnpm --filter web format`     | Prettier                                    |
| `pnpm --filter web test:unit`  | Vitest (jsdom) + React Testing Library      |
| `pnpm --filter web test:e2e`   | Playwright (requires the API + SPA running) |

## Adding UI components

shadcn/ui primitives land in `@app/ui`, not here:

```bash
pnpm --filter @app/ui ui:add button input label card alert
```
