---
name: db-reset
description: Wipe and recreate the local Postgres + Redis stack for this repo, then re-run Laravel migrations (and optionally seeders). Use when the user asks to "reset the database", "rebuild the dev DB", "start fresh", or after a destructive schema change that breaks the dev stack.
---

# db-reset

Resets the local `starterkit` docker compose stack (Postgres 17 + Redis 7) and brings the Laravel
schema back from zero.

## When to use

- User wants a clean dev database.
- Migrations have diverged badly enough that `migrate:fresh` is the right tool.
- Switching branches across a major schema change.

## Preconditions

1. Docker is running (`docker ps` should not error).
2. `backend/.env` exists with `DB_*` and `REDIS_*` set (copy from `backend/.env.example` if not).
   Compose reads these via `--env-file ./backend/.env`.
3. **Confirm with the user first** — `db:reset` deletes the `starterkit-postgres-data` and
   `starterkit-redis-data` volumes. Local data is gone.
4. Run Artisan on **PHP 8.4** (see the `php-84-runtime` skill).

## Host ports (this repo)

Postgres → host **5434** (`DB_PORT`), Redis → host **6381** (`REDIS_PORT`). Containers still listen on
5432/6379 internally. These non-default ports avoid colliding with other local stacks.

## Steps

1. From the repo root: `pnpm db:reset`
   - = `docker compose --env-file ./backend/.env down -v && docker compose --env-file ./backend/.env up -d --wait postgres redis`.
   - The `--env-file` flag is required — `backend/.env` is the single source of truth for compose
     substitution. Don't run plain `docker compose ...`.
   - **Run `pnpm db:*` from the repo ROOT.** Running it from `backend/` (or via a parallel shell that
     `cd`'d away) fails with "Command db:up not found".
2. Wait for healthy (the `--wait` flag does this; or poll `docker compose --env-file ./backend/.env ps`).
3. From `backend/`, on PHP 8.4: `php artisan migrate` (add `:fresh --seed` once seeders exist).
4. Sanity-check: `php artisan migrate:status` (all "Ran"). For a non-interactive table peek, use
   `php -r` with PDO against `127.0.0.1:5434` rather than `php artisan db:table` (which can prompt/hang).

## Notes

- Postgres extensions (`pgcrypto`, `uuid-ossp`, `citext`, `pg_trgm`, …) are created at **first init**
  by `docker/postgres/init/01-extensions.sql`. Changing the DB name or extensions requires a
  `db:reset` to re-init.
- The compose stack is **dev-only** (durability-tuned Redis, no TLS). Production never goes through
  this skill.
- Don't add `--no-verify` or skip hooks anywhere in this flow.
