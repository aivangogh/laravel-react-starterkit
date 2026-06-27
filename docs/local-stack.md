# Local Stack (Docker)

> **Status:** done (Phase 1). The backend runs on this Docker **Postgres 17 + Redis 7** stack.

## Overview

```
docker-compose.yml          # postgres + redis services
docker/
  postgres/
    init/01-extensions.sql   # extensions enabled at first init
  redis/
    redis.conf               # dev-tuned redis config
backend/.env                 # single source of truth for DB + Redis credentials
```

`docker-compose.yml` reads credentials directly from `backend/.env` so the containers and Laravel
never drift out of sync. Compose project name: `starterkit` (suggested). Named volumes persist data.

## Scripts (root `package.json`)

```bash
pnpm db:up        # docker compose --env-file ./backend/.env up -d --wait postgres redis
pnpm db:down      # stop containers (volumes persist)
pnpm db:logs      # tail postgres + redis logs
pnpm db:reset     # down -v (DELETES volumes) then up
pnpm db:migrate   # cd backend && php artisan migrate
```

## Postgres 17

- Extensions enabled at first init (`docker/postgres/init/01-extensions.sql`):
  `pgcrypto`, `uuid-ossp`, `citext`, `pg_trgm`, `btree_gin`, `unaccent`.
- The database name is taken from `DB_DATABASE` **at first container init only**. To change it later,
  `pnpm db:reset` (destroys data) and re-up.

`backend/.env` (target):

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5434
DB_DATABASE=starterkit
DB_USERNAME=starterkit
DB_PASSWORD=secret
```

> **Ports:** this kit maps Postgres to host **5434** and Redis to host **6381** (containers still
> listen on 5432/6379 internally) so it can run alongside other local stacks that already use
> 5432/5433/6379/6380. Change `DB_PORT` / `REDIS_PORT` in `backend/.env` if those collide too —
> compose reads them via `--env-file`.

## Redis 7

Tuned for Laravel cache / queue / session / broadcast (`docker/redis/redis.conf`): AOF on, RDB
snapshots on, `allkeys-lru`, `maxmemory 512mb`. A password is layered on only when `REDIS_PASSWORD`
is set (and not Laravel's `null` sentinel).

`backend/.env` (target):

```dotenv
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6381
REDIS_PASSWORD=null

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

> **`predis`, not `phpredis`:** the PHP 8.4 build here has no `phpredis` extension, so the kit uses
> the pure-PHP `predis/predis` client (`composer require predis/predis`). `BROADCAST_CONNECTION`
> stays `log` until broadcasting is needed.

## Dev-only tuning → prod

The compose tuning above is **dev-only**. For production:

- Use managed Postgres/Redis or hardened containers with real credentials and TLS.
- Turn off permissive memory eviction where durability matters; size `maxmemory` to the host.
- Run migrations as a deploy step, never on container init.

## Troubleshooting

- **Containers won't start (missing env)** — ensure `backend/.env` exists; compose reads it.
- **`database "X" does not exist`** — DB name is set at first init only; `pnpm db:reset` to recreate.
- **Permission errors on `pnpm db:*`** — Docker Desktop must be running (WSL integration on Windows).
