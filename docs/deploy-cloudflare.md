# Deploying to Cloudflare (demo/staging)

Everything runs on Cloudflare: the SPA as a static-assets Worker at
`app.<domain>`, the Laravel API in a **Cloudflare Container** (fronted by a
tiny Worker) at `api.<domain>`. Postgres and Redis are external managed
services — Containers have no persistent disk or data products that Laravel
can use directly.

| Piece | Where | Config |
| --- | --- | --- |
| SPA (`apps/web/dist`) | Worker static assets | `apps/web/wrangler.jsonc` |
| Laravel API | Cloudflare Container (FrankenPHP, PHP 8.4) | `infra/api-worker/wrangler.jsonc`, `backend/Dockerfile` |
| Postgres 17 | Neon (free tier) | `DB_URL` secret |
| Redis | Upstash (free tier, TLS) | `REDIS_URL` secret |

Requirements: Workers **Paid** plan ($5/mo — Containers need it), a domain on
the Cloudflare zone, Docker running locally (wrangler builds the image),
`wrangler` ≥ 4 logged in (`npx wrangler login`).

The SPA and API **must** share a parent domain: Sanctum auth rides on a
session cookie scoped to `SESSION_DOMAIN=.<domain>`. A `*.pages.dev` +
`*.workers.dev` split will not work.

## 1. Provision data services

**Neon** (https://neon.tech): create a Postgres 17 project, then run the
statements from `docker/postgres/init/01-extensions.sql` against the database
(Neon SQL editor) to enable `pgcrypto`, `uuid-ossp`, `citext`, `pg_trgm`,
`btree_gin`, `unaccent`. Copy the pooled connection string and convert it to
Laravel's scheme: `postgresql://user:pass@host/db?sslmode=require`.

**Upstash** (https://upstash.com): create a Redis database, copy the TLS URL
(`rediss://default:pass@host:port`). The backend already uses `predis`, so no
PHP extension is needed.

## 2. Point the configs at your zone

Replace `example.com` in:

- `infra/api-worker/wrangler.jsonc` — `routes`, and the `vars` block
  (`APP_URL`, `FRONTEND_URL`, `SESSION_DOMAIN`).
- `apps/web/wrangler.jsonc` — `routes`.

Wrangler creates the DNS records for zone routes on deploy.

## 3. Deploy the API

```sh
pnpm install                      # installs wrangler for infra/api-worker
cd infra/api-worker

# Secrets (only these three; everything else is plain vars in wrangler.jsonc)
npx wrangler secret put APP_KEY   # generate: cd backend && php artisan key:generate --show
npx wrangler secret put DB_URL    # Neon postgresql://... URL
npx wrangler secret put REDIS_URL # Upstash rediss://... URL

npx wrangler deploy               # builds backend/Dockerfile, pushes, deploys
```

On boot the container caches config, runs `php artisan migrate --force`, and
starts a `queue:work` process alongside the web server
(`backend/docker/entrypoint.sh`). Boot-time migration and the in-container
worker are demo-grade choices — move both to a deploy step / separate service
before scaling past one instance.

Check: `curl https://api.<domain>/up` → 200. First request after idle cold-starts
the container (~10–30 s).

## 4. Deploy the SPA

Build with the production API origin baked in, then deploy:

```sh
VITE_API_URL=https://api.<domain> pnpm --filter web build
cd apps/web && npx wrangler deploy
```

(On PowerShell: `$env:VITE_API_URL = "https://api.<domain>"; pnpm --filter web build`.)

## 5. Verify

1. `https://api.<domain>/up` returns 200.
2. Open `https://app.<domain>`, register/log in. In devtools, the session +
   `XSRF-TOKEN` cookies should be set for `.<domain>` and the authenticated
   `/api/user` request should succeed — that proves CORS
   (`FRONTEND_URL`-derived) and Sanctum stateful domains are right.
3. Hard-refresh a nested route (e.g. `/dashboard`) — the SPA fallback should
   serve it, not a 404.
4. Trigger something queued (e.g. a verification email) and watch it process:
   `cd infra/api-worker && npx wrangler tail`.

## Redeploying

- API code change → `cd infra/api-worker && npx wrangler deploy` (rebuilds the image).
- SPA change → rebuild with `VITE_API_URL` set, then `cd apps/web && npx wrangler deploy`.
- Env/var change → edit `wrangler.jsonc` vars or `wrangler secret put`, redeploy the API worker.

## Deploying the E-commerce preset

Never run `php artisan kit:install` in **this** repo — `ModulePublisher` *moves*
the module stubs into the app, which would strip them out of the template you
ship. Deploy ecommerce from a scaffolded copy instead:

```sh
# 1. Scaffold a fresh app and shape it
pnpm create laravel-vue-starterkit my-shop
cd my-shop
pnpm run setup                 # choose preset: E-commerce (runs kit:install,
                               # migrate + seed; needs PHP 8.4 + local DB)
git add -A && git commit -m "chore: install ecommerce preset"
```

```sh
# 2. Graft the Cloudflare files from the starter kit repo (they're not in the
#    pinned scaffold tag): copy these paths verbatim into my-shop/
#      backend/Dockerfile
#      backend/.dockerignore
#      backend/docker/entrypoint.sh
#      apps/web/wrangler.jsonc
#      infra/api-worker/            (whole directory, minus node_modules)
#    then:
#      - add `- "infra/*"` to pnpm-workspace.yaml
#      - add the trustProxies(at: env('TRUSTED_PROXIES')) line to
#        backend/bootstrap/app.php (see this repo's copy)
pnpm install
```

3. Follow steps 1–5 above from inside `my-shop`, with its own Neon database
   (the ecommerce migrations/seeders run at container boot) and its own
   subdomains — e.g. `shop.<domain>` / `shop-api.<domain>` if the basic demo
   already occupies `app.` / `api.` (update both `wrangler.jsonc` files and
   give the workers distinct `name`s, e.g. `shop-api` / `shop-web`).

The seeded demo data (products/categories/orders + default admin) comes from
the preset's seeders, so the deployed site is demo-ready on first boot.

## Known limitations (accepted for demo)

- Container disk is **ephemeral**: medialibrary/file uploads vanish on
  restart. Move `FILESYSTEM_DISK` to R2 via `league/flysystem-aws-s3-v3`
  when uploads matter.
- Mail is unconfigured (`log` mailer) — point `MAIL_*` vars at Resend/Mailgun
  for real email.
- Single container instance, migrations at boot, no CI/CD — all fine for
  staging, none of it production posture.
