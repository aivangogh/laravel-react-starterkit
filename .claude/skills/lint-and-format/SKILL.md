---
name: lint-and-format
description: Run the lint + format + type-check pipeline across both halves of the repo (the pnpm workspace and the Laravel backend). Use before commits/PRs, after large refactors, or when the user asks to "clean up", "fix lint", "format the repo", or "run all checks".
---

# lint-and-format

Runs every linter, formatter, and type-checker the repo configures.

## When to use

- User asks to run lint/format/type-check.
- About to commit or open a PR.
- After a multi-file change crossing frontend and backend.

## Frontend + shared packages (pnpm workspace)

From the repo root:

1. `pnpm format` — Prettier across `apps/*` + `packages/*` (config base in `@app/config`).
2. `pnpm lint` — each workspace's `lint` script. For `apps/web` this is `eslint .` (flat config built
   on `@app/config/eslint`: typescript-eslint + `react-hooks` + `react-refresh`). Packages without
   lintable source have no-op lint scripts.
3. `pnpm type-check` — `tsc` across the workspace. `@app/types` runs real `tsc`.

Scope to one workspace when only it changed: `pnpm --filter web lint && pnpm --filter web type-check`.

## Backend (Laravel)

From `backend/`, on **PHP 8.4** (see `php-84-runtime`):

1. `./vendor/bin/pint` — code style (Laravel preset). `--test` to check without writing.
2. `php artisan test` — PHPUnit today (Pest is the intended runner per conventions). Treat failing
   tests as part of the cleanup.

## Order matters

Formatters **before** linters (prevents lint churn being undone by a later format pass). Type-check
**after** lint (some lint fixes change types).

One-shot from repo root (PHP 8.4 on PATH):

```bash
pnpm format && pnpm lint && pnpm type-check && (cd backend && ./vendor/bin/pint && php artisan test)
```

## Notes

- Don't `--no-verify` commits if a hook fails — fix the cause.
- If `tsc` reports spurious errors, delete `*.tsbuildinfo` (gitignored) and rerun.
- `.editorconfig` is authoritative: LF, final newline, 2-space default, 4-space PHP. `.gitattributes`
  normalizes line endings to LF — the `CRLF will be replaced by LF` warning on `git add` is safe.
