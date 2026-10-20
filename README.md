# Laravel + React Starter Kit

A reusable, decoupled starter kit built as a **pnpm-workspace monorepo**:
a **React 19 + TypeScript SPA** in `apps/web`, shared code in `packages/*`, and a **Laravel 13 API**
in `backend/` (outside the JS workspace). Ships with Spatie roles/permissions and activity logging,
and an interactive installer (`kit:install`) to pick a **Basic** or **E-commerce** preset per project.

> **Status:** the backend API, `kit:install` presets, e-commerce module and `pnpm create` scaffolder
> are built. The SPA has been ported from Vue 3 to React 19 (see [CHANGELOG.md](CHANGELOG.md) →
> Unreleased). See [docs/roadmap.md](docs/roadmap.md).

```bash
pnpm create laravel-react-starterkit my-app
```

## Architecture

```
laravel-react-starterkit/
├── apps/
│   └── web/            # React 19 + TS SPA (Vite)
├── packages/
│   ├── config/         # @app/config — eslint / prettier / tsconfig
│   ├── types/          # @app/types  — shared FE↔BE TS contract
│   ├── ui/             # @app/ui     — shadcn/ui (Base UI) design system
│   └── create-laravel-react-starterkit/  # `pnpm create` scaffolder
├── backend/            # Laravel 13 API — NOT a workspace member
├── docker/             # Postgres 17 + Redis 7 config
├── docs/               # documentation
├── scripts/            # setup.mjs (`pnpm run setup`)
├── pnpm-workspace.yaml
├── package.json        # root workspace scripts
└── README.md
```

The web app is a separately-deployed SPA that talks to the Laravel API over HTTP/JSON. The two
sides share a typed contract via `@app/types`. The Laravel backend is intentionally **outside** the
pnpm workspace — it has its own Composer toolchain.

## Stack at a glance

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, **TanStack Router** (file-based) + **TanStack Query** (all server state), Axios, Valibot, Tailwind 4, **shadcn/ui on Base UI** (`@app/ui`), `@tanstack/react-table`, lucide-react |
| Backend | Laravel 13.17 on **PHP 8.4**, Sanctum + Fortify auth, Spatie permission/activitylog/medialibrary/settings |
| Data | **Postgres 17 + Redis 7** via Docker (`predis` client) |
| Tooling | **pnpm** workspace, ESLint, Prettier, Vitest + React Testing Library + Playwright (FE); Pint/Pest (BE) |

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
