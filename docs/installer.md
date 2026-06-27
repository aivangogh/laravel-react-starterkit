# One-Command Installer (Planned)

> **Status:** design only — **chosen approach locked, not yet built.** This is a *late* phase: the
> public scaffolder clones the **finished, verified** template, so it depends on Phases 0–8 being
> complete. See [roadmap.md](roadmap.md) (Phase 9). Captured now so the decision survives.

## Goal

Go from nothing to a running web + API + database stack with a single command:

```bash
pnpm create laravel-vue-starterkit my-app
#   also: npm create laravel-vue-starterkit@latest my-app
#   also: npx  create-laravel-vue-starterkit my-app
```

…which scaffolds the repo, installs **both** ecosystems, brings up the data layer, migrates/seeds,
runs the interactive preset picker, and prints next steps — leaving you at `pnpm dev`.

## Why a Node scaffolder (and not `composer create-project`)

The repo root is a **pnpm workspace** (`apps/*` + `packages/*`); the Composer package lives one level
down in `backend/`. So `composer create-project` / `laravel new --using` would only own the backend,
not the `apps/`+`packages/` tree — it fights the structure. A small Node `create-*` package fits a
**hybrid monorepo** naturally: it owns the whole tree and can drive Composer, `php artisan`, Docker,
and pnpm in the right order. (See the entrypoint comparison in the project history; Tier B was
chosen.)

## Two layers

The installer is deliberately split so the heavy lifting is reusable:

```
create-laravel-vue-starterkit   (npm package — the "outer wrapper")
  └─ fetch template → run ↓
scripts/setup.mjs               (in-repo orchestrator — "pnpm setup")
  └─ deps + data layer + migrate + build → hand off to ↓
php artisan kit:install         (app shaping — preset/module stubs + seed)
```

### Layer 1 — the scaffolder (`create-laravel-vue-starterkit`)

A tiny Node `bin` published to npm. Responsibilities **only**:

1. Resolve/validate the target directory (must be empty or new).
2. **Fetch the template** — degit/tiged the GitHub repo **at a release tag** (no `.git` history, no
   `node_modules`/`vendor`). Pinning to a tag keeps `create` reproducible.
3. Light prompts: project name, preset (`basic` | `ecommerce`) — passed through to `kit:install`.
4. Shell out to **`pnpm setup`** (Layer 2). Nothing else lives here.

Keeping it thin means the same setup logic is shared by `create`, by "Use this template" clones, and
by CI — no drift.

### Layer 2 — the orchestrator (`pnpm setup` → `scripts/setup.mjs`)

A cross-platform Node script (Node is guaranteed present; a bash script would break on Windows — this
is a Windows-primary project). **Idempotent** — safe to re-run. Steps, in order:

1. **Preflight / fail fast.** Assert: Node ≥ 22, pnpm ≥ 10, Composer present, and **`php -v` ≥ 8.4**
   (see the gotcha below). Detect whether Docker is available.
2. **Backend env.** Copy `backend/.env` from `.env.example` if absent.
3. **Backend deps.** `composer install` in `backend/` (using the 8.4 PHP — see gotcha).
4. **App key.** `php artisan key:generate`.
5. **Data layer.**
   - Docker available → `pnpm db:up` (Postgres 17 + Redis 7) and ensure `backend/.env` is set to
     `pgsql` + Redis (see [local-stack.md](local-stack.md)).
   - No Docker → **fall back to SQLite** (touch `backend/database/database.sqlite`, set
     `DB_CONNECTION=sqlite`). The kit still runs; this matches the current default install.
6. **Migrate.** `php artisan migrate --force`.
7. **Frontend deps + shared packages.** `pnpm install` at the root, then build the source packages
   so apps resolve them (`@app/config`, `@app/types`; `@app/ui` is source-only).
8. **Hand off to `kit:install`.** Run `php artisan kit:install` (interactive) for preset/feature
   choice + seeding. Accept `--preset=basic --no-interaction` for CI/scaffolder pass-through.
9. **Print next steps** — `pnpm dev`, the URLs, and the default admin credentials.

### Layer 3 — `php artisan kit:install` (already designed)

Unchanged from [modules.md](modules.md): it **shapes the app** (preset/module stub copy + seed),
while `setup.mjs` handles **environment/plumbing**. `setup` calls it last. Clean separation:
re-running `kit:install` later to add a module never re-touches deps/Docker.

## The PHP 8.4 gotcha (the orchestrator must handle this)

On this machine the default `php` is **8.2** and Composer has a global `platform.php = 8.2` pin. The
local `backend/composer.json` pins `8.4.22` for *dependency resolution*, but the **runtime** PHP must
actually be 8.4 or the installed Laravel 13 stack won't run. So `setup.mjs` will:

- Run `php -v`; if `< 8.4`, **abort with a clear message** + the PATH hint from
  [getting-started.md](getting-started.md).
- Allow an override (`--php-bin=<path>` or `STARTERKIT_PHP` env) pointing at the 8.4 binary, and use
  it for **all** `php`/`composer` invocations so resolution and runtime agree.

## Prerequisites (not a zero-dependency installer)

The scaffolder can't bundle a PHP/Composer/Docker runtime. The host still needs the tooling from
[getting-started.md](getting-started.md): **PHP 8.4+, Composer 2, Node 22+, pnpm 10+**, and Docker
(optional — without it the kit installs on SQLite).

## Release mechanics

- Tag template releases (`vX.Y.Z`); the scaffolder degit-pins to a tag, not `main`.
- Publish `create-laravel-vue-starterkit` to npm; the `create-*` name enables `pnpm/npm create`.
- The scaffolder version and the template tag it pulls move together.

## Build order

`scripts/setup.mjs` can be grown **incrementally** as its dependencies land (db scripts in Phase 1,
`apps/web` in Phase 5), and verified by Phase 8. The **public scaffolder ships only after Phase 8**,
once a fresh checkout provably boots. See **Phase 9** in [roadmap.md](roadmap.md).
