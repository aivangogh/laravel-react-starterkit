---
name: ci-readiness
description: Pre-push / pre-PR gate. Run the project's checks locally before pushing so a branch never lands broken. Use when about to push a branch, open a PR, mark a PR ready, or when the user says "ship", "push", "PR this", "make sure it passes", "all green", "wrap up".
---

# ci-readiness — don't push broken

Run every check locally before pushing. (Dedicated GitHub Actions workflows aren't set up yet — when
they are, this list is exactly what they should mirror.) Run all backend commands on **PHP 8.4**
(`php-84-runtime`).

## TL;DR — run before pushing

```bash
# Frontend + shared packages (repo root)
pnpm install --frozen-lockfile
pnpm -r --filter "./apps/*" --filter "./packages/*" lint
pnpm -r --parallel --filter "./apps/*" --filter "./packages/*" type-check
pnpm -r --filter "./apps/*" --filter "./packages/*" build       # once apps/web exists

# Backend (needs the stack up) — PHP 8.4 on PATH
pnpm db:up
cd backend
./vendor/bin/pint --test
php artisan migrate --force
php artisan test
cd ..

# Security
pnpm audit --audit-level high
( cd backend && composer audit )
```

If any line exits non-zero, **fix it before pushing.** Don't push and "let CI tell me."

## Failure modes that bite *this* repo

1. **Ran on PHP 8.2.** `composer install` resolved old majors, or `artisan` failed. Re-run with PHP
   8.4 on PATH (`php-84-runtime`). Confirm `php -v` → 8.4.22.
2. **`pnpm db:*` "command not found".** You ran it from `backend/` or a shell that `cd`'d away — run
   `pnpm db:*` from the **repo root**.
3. **Backend tests fail with "no DB connection".** Postgres isn't up → `pnpm db:up` (waits for
   healthy), then retry. Ports are 5434 (pg) / 6381 (redis).
4. **Port already allocated on `db:up`.** Another local stack holds the port. Change `DB_PORT`/
   `REDIS_PORT` in `backend/.env` and re-up.
5. **`apps/*` filter prints "No projects matched."** Expected until `apps/web` lands (Phase 5) — a
   notice, not a failure.
6. **CRLF/LF churn.** `.gitattributes` enforces `eol=lf`; the `CRLF will be replaced by LF` warning on
   `git add` is safe — don't suppress it.
7. **Type-check passes locally, would fail clean.** A stale `*.tsbuildinfo` can hide errors — delete it
   and re-run `pnpm type-check`.
8. **`grep -rn "from '@/" packages/ui/src/` is non-empty.** A `packages/ui` component imports an app
   path → breaks portability. Use `@app/ui/...` inside `packages/ui`.
9. **Auth change.** Re-run the cookie smoke test (`sanctum-fortify-auth` skill): CSRF → register →
   `/api/user` 200.

## Secrets / audit

- `pnpm audit` / `composer audit` high findings: bump the offending dep, or pin the transitive via a
  root `pnpm.overrides` (document why). Don't `--ignore`.
- Never stage a `.env`. `.gitignore` excludes all `.env*` except `.env.example`; if one is staged your
  IDE added it — unstage. Real secrets go in `backend/.env` (gitignored), never in source.

## Hard don'ts

- Don't `git push --force` to `main`.
- Don't bypass hooks (`--no-verify`).
- Don't commit `vendor/`, `node_modules/`, `database/*.sqlite`, or any `.env`.
- Don't disable a check to make it green — fix the failure or file a follow-up with an owner.

## Related skills

`lint-and-format`, `commit-conventions`, `php-84-runtime`, `db-reset`, `sanctum-fortify-auth`.
