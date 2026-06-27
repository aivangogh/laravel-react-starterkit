# Laravel + Vue Starter Kit

A reusable, decoupled starter kit built as a **pnpm-workspace monorepo**:
a **Vue 3 + TypeScript SPA** in `apps/web`, shared code in `packages/*`, and a **Laravel 13 API**
in `backend/` (outside the JS workspace). Ships with Spatie roles/permissions and activity logging,
and a planned interactive installer to pick a **Basic** or **E-commerce** preset per project.

> **Status (2026-06-27):** Backend basic install done; the **monorepo shell** is scaffolded
> (`packages/{config,types,ui}`, `@app/*`); and **Phase 1 is done** — the backend now runs on
> **Docker Postgres 17 + Redis 7**, with the `User` traits, headless Fortify, and Sanctum SPA cookie
> auth wired and **verified end-to-end** (CSRF → register → authenticated `/api/user`, with an
> activity-log entry). Still planned: the **`apps/web` frontend**, the API controllers, the
> `kit:install` installer, and the e-commerce module. See [docs/roadmap.md](docs/roadmap.md).

## Target architecture

```
laravel-vue-starterkit/
├── apps/
│   └── web/            # Vue 3 + TS SPA (Vite)                       [planned]
├── packages/
│   ├── config/         # @app/config — eslint / prettier / tsconfig  [scaffolded]
│   ├── types/          # @app/types  — shared FE↔BE TS contract       [scaffolded]
│   └── ui/             # @app/ui     — shadcn-vue design system       [scaffolded]
├── backend/            # Laravel 13 API — NOT a workspace member     [installed + wired]
├── docker/             # Postgres 17 + Redis 7 config                [done]
├── docs/               # documentation
├── pnpm-workspace.yaml #                                             [done]
├── package.json        # root workspace scripts                      [done]
└── README.md
```

The web app is a separately-deployed SPA that talks to the Laravel API over HTTP/JSON. The two
sides share a typed contract via `@app/types`. The Laravel backend is intentionally **outside** the
pnpm workspace — it has its own Composer toolchain.

## Stack at a glance

| Layer | Choice |
|---|---|
| Frontend | Vue 3 (`<script setup lang="ts">`), Vite, Vue Router, **Pinia** (client state) + **TanStack Query** (server state), Axios, Tailwind 4, **shadcn-vue** (`@app/ui`), lucide |
| Backend | Laravel 13.17 on **PHP 8.4**, Sanctum + Fortify auth, Spatie permission/activitylog/medialibrary/settings |
| Data | **Postgres 17 + Redis 7** via Docker (`predis` client) |
| Tooling | **pnpm** workspace, oxlint → eslint, Prettier, Vitest + Playwright (FE); Pint/Pest (BE) |

## What's installed right now (backend)

| Package | Version |
|---|---|
| laravel/framework | 13.17.0 |
| laravel/sanctum | 4.3.2 |
| laravel/fortify | 1.37.2 |
| spatie/laravel-permission | 8.0.0 |
| spatie/laravel-activitylog | 5.0.0 |
| spatie/laravel-medialibrary | 11.23.1 |
| spatie/laravel-settings | 3.9.0 |

## Documentation

Start here → [**docs/README.md**](docs/README.md)

- [Getting started](docs/getting-started.md) · [Architecture](docs/architecture.md)
- [Frontend (`apps/web`)](docs/frontend.md) · [Backend (`backend/`)](docs/backend.md) · [Packages (`packages/*`)](docs/packages.md)
- [Local stack (Docker)](docs/local-stack.md) · [Conventions](docs/conventions.md)
- [Roles & permissions](docs/rbac.md) · [Activity log](docs/activity-log.md)
- [Modules & installer](docs/modules.md) · [Roadmap](docs/roadmap.md)
