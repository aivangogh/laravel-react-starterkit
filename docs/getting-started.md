# Getting Started

This walks a fresh checkout from zero to a running web + API + database stack. Steps are marked
**[works now]** or **[planned]** to reflect the current build state ([roadmap.md](roadmap.md)).

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **PHP** | **8.4+** | Laravel 13 + Spatie permission v8 / activitylog v5 require ≥ 8.3/8.4. **8.2 will not work.** |
| **Composer** | 2.x | Manages `backend/` PHP deps |
| **Node** | 22+ | For the JS workspace |
| **pnpm** | 9+ | Pinned via `packageManager`. **Do not** use npm/yarn at the repo root |
| **Docker** | recent | For the local Postgres + Redis stack |
| PHP extensions | — | `pdo_pgsql` (+ `pdo_sqlite` for the current install), `redis` or `predis`, `mbstring`, `openssl`, `curl`, `gd`, `intl`, `zip`, `fileinfo`, `exif` |

### ⚠️ The PHP 8.4 requirement (important on this machine)

This machine's default `php` is **8.2**, and Composer has a **global platform pin** of
`platform.php = 8.2` (in `C:/Users/Dominic/AppData/Roaming/Composer`). That pin makes Composer
resolve dependencies *as if* PHP were 8.2, which silently downgrades the stack.

This project works around it without changing your global config:

1. **PHP 8.4 is installed** at `D:\php\php-8.4.22-nts-Win32-vs17-x64`.
2. `backend/composer.json` pins `config.platform.php = 8.4.22` locally (overrides the global pin).

Run `php`/`composer`/`artisan` against 8.4 by prepending it to `PATH`:

```bash
# Git Bash
export PATH="/d/php/php-8.4.22-nts-Win32-vs17-x64:$PATH"
php -v   # should print 8.4.22
```
```powershell
# PowerShell
$env:PATH = "D:\php\php-8.4.22-nts-Win32-vs17-x64;$env:PATH"
```

To make it permanent, move that directory **ahead** of the 8.2 directory in your user `Path`.

## 1. Install JS workspace deps  *[works now]*

The workspace (`pnpm-workspace.yaml` + `packages/{config,types,ui}`) is scaffolded; `apps/web` arrives
in Phase 5.

```bash
pnpm install        # installs all of packages/* (and apps/* once it exists)
```

The Laravel backend is a sibling, not a workspace member — it has its own toolchain (step 3).

## 2. Start Postgres + Redis  *[works now]*

The local stack is defined in `docker-compose.yml` and reads credentials from `backend/.env`
(host ports **5434**/**6381**; see [local-stack.md](local-stack.md)):

```bash
pnpm db:up        # start postgres + redis (detached)
pnpm db:logs      # tail logs
pnpm db:down      # stop (data persists in named volumes)
pnpm db:reset     # stop AND delete volumes (destroys local data)
```

## 3. Set up the backend  *[works now]*

```bash
cd backend
cp .env.example .env        # only if .env doesn't exist
composer install
php artisan key:generate
php artisan migrate         # against Postgres (start the stack first, step 2)
```

> **DB note:** the backend is configured for **Postgres + Redis** (`predis`). Start the Docker stack
> (step 2) before `migrate`. Redis needs no PHP extension — the kit uses `predis/predis`.

Run the API:

```bash
php artisan serve          # http://127.0.0.1:8000  (use a free port, e.g. --port=8001)
```

## 4. Run the web app  *[planned]*

```bash
pnpm dev                   # apps/web on Vite (http://localhost:5173)
```

Common workspace scripts (planned root `package.json`):

```bash
pnpm build        # build apps + packages
pnpm lint         # oxlint + eslint
pnpm format       # prettier
pnpm type-check   # vue-tsc / tsc
pnpm test:unit    # vitest
pnpm test:e2e     # playwright
```

## 5. Verify

| Check | Command / URL |
|---|---|
| Backend boots | `php artisan about` → Laravel 13.17.0 / PHP 8.4.22 **[works now]** |
| Migrations | `php artisan migrate:status` → all "Ran" **[works now]** |
| Web | `http://localhost:5173` **[planned]** |
| Postgres | `psql` against `localhost:5432` with `backend/.env` creds **[planned]** |
| Redis | `redis-cli ping` → `PONG` **[planned]** |
