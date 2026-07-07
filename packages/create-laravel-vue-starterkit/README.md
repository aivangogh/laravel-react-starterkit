# create-laravel-vue-starterkit

Scaffold a new [Laravel 13 + Vue 3 monorepo starter kit](https://github.com/DMNCDLPRT/laravel-vue-starterkit) — fetches the template and bootstraps the full web + API + database stack.

```bash
pnpm create laravel-vue-starterkit my-app
# or
npm  create laravel-vue-starterkit@latest my-app
npx  create-laravel-vue-starterkit my-app
```

You'll get an interactive **preset** picker (Basic or E-commerce); then it clones the template and
runs `pnpm run setup` for you, leaving you at `pnpm dev`.

## Prerequisites

Not a zero-dependency installer — the host needs the toolchain the kit runs on:

- **PHP 8.4+** and **Composer 2** (the Laravel API)
- **Node 22+** and **pnpm 10+** (the Vue SPA + this scaffolder)
- **git** (to fetch the template)
- **Docker** — optional; without it the kit installs on SQLite

## Flags

| Flag | Purpose |
| --- | --- |
| `--preset=basic\|ecommerce` | Skip the preset prompt |
| `--no-interaction` | No prompts (defaults / flags only) |
| `--sqlite` | Force the SQLite data layer (skip Docker) |
| `--php-bin=<path>` | Point at a PHP 8.4 binary if it isn't your default `php` |
| `--no-setup` | Clone only; run `pnpm run setup` yourself later |
| `--ref=<git-ref>` · `--repo=<owner/repo>` | Fetch a specific ref / fork (mainly for testing) |

## How it works

Two layers, so the heavy lifting is reusable:

1. **This package** (thin, dependency-free) — validate the target dir, `git clone --depth 1` the
   template at a pinned ref, drop `.git`, hand off to →
2. **`pnpm run setup`** (`scripts/setup.mjs` in the template) — preflight, backend deps + env, data
   layer (Docker → SQLite fallback), frontend deps, then `php artisan kit:install`.

See [`docs/installer.md`](https://github.com/DMNCDLPRT/laravel-vue-starterkit/blob/main/docs/installer.md).
