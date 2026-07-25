# Deploying on a VM + Cloudflare

The whole backend stack — Laravel (FrankenPHP), Postgres 17, Redis — runs on
one Linux VM via `infra/vm/docker-compose.prod.yml`. Any host works (AWS EC2
on free credits, Oracle Always Free, Hetzner, DigitalOcean…) because the VM
only needs Docker and outbound internet.
Cloudflare serves the SPA (free Workers static assets, `apps/web/wrangler.jsonc`)
and exposes the API through a **Cloudflare Tunnel** — no open ports on the VM,
no TLS certs to manage, HTTPS at the edge.

```
app.<domain>  → Cloudflare Worker (static SPA)
api.<domain>  → Cloudflare Tunnel → cloudflared container → app:8080 (Laravel)
                                     └ postgres / redis (same compose network)
```

Sanctum cookie auth needs the shared parent domain: `SESSION_DOMAIN=.<domain>`
is set in `infra/vm/.env`.

## 1. Create the VM

Rules regardless of provider: Ubuntu 24.04 (x86 or ARM — everything here is
arch-agnostic), ≥2 GB RAM recommended, **no inbound ports opened except SSH**
(the tunnel is outbound-only), your SSH public key installed.

### AWS EC2 (free-plan credits)

EC2 console → **Launch instance**:
- AMI: **Ubuntu Server 24.04 LTS**.
- Instance type: **t4g.small** (ARM, 2 vCPU / 2 GB) or **t3.small** (x86) —
  comfortably covered by the free-plan credits. Avoid 1 GB micro sizes;
  Postgres + Redis + PHP is tight there.
- Key pair: create + download one (used for `ssh -i`).
- Network settings: allow **SSH only**, source "My IP"; do **not** add
  HTTP/HTTPS rules.
- Storage: 20–30 GB gp3. Launch and note the public IP; login user is `ubuntu`.

### Oracle Cloud Always Free (alternative, $0 forever)

OCI console → Compute → Create instance: Ubuntu 24.04 aarch64, shape
**Ampere A1 Flex** (up to 4 OCPU / 24 GB free). A1 capacity is scarce —
"out of capacity" errors are common; retry off-peak or upgrade the account
to Pay As You Go (Always Free resources stay $0) for immediate allocation.

## 2. Install Docker on the VM

```sh
ssh ubuntu@<vm-ip>
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && exit   # re-ssh so the group applies
```

## 3. Create the Cloudflare Tunnel

Cloudflare dashboard → **Zero Trust → Networks → Tunnels → Create a tunnel**
(Cloudflared connector):
1. Name it (e.g. `starterkit-api`), save.
2. From the docker install snippet shown, copy only the **token** (the long
   string after `--token`).
3. **Public hostname** tab: hostname `api.<domain>`, service
   **HTTP** → `app:8080` (cloudflared shares the compose network, so the
   Laravel container is reachable as `app`). This also creates the DNS record.

## 4. Deploy the stack

On the VM:

```sh
git clone <your-repo-url> starterkit && cd starterkit/infra/vm
cp .env.example .env
nano .env   # APP_KEY (php artisan key:generate --show locally), domain URLs,
            # DB_PASSWORD, TUNNEL_TOKEN
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f app   # watch migrate + boot
```

The app entrypoint caches config, runs `php artisan migrate --force`, and
starts a queue worker (`backend/docker/entrypoint.sh`). Postgres extensions
are enabled automatically on first init from `docker/postgres/init/`.

Check: `curl https://api.<domain>/up` from anywhere → 200.

## 5. Deploy the SPA to Cloudflare (free plan)

From your dev machine, with `apps/web/wrangler.jsonc` pointing at your zone:

```sh
VITE_API_URL=https://api.<domain> pnpm --filter web build
cd apps/web && npx wrangler login && npx wrangler deploy
```

## 6. Verify

1. `https://api.<domain>/up` → 200.
2. `https://app.<domain>` → register/login; session + `XSRF-TOKEN` cookies on
   `.<domain>`; authenticated `/api/user` succeeds.
3. Hard-refresh a nested route — SPA fallback serves it.
4. Queued jobs process: `docker compose -f docker-compose.prod.yml logs app`.

## Updating

```sh
cd starterkit && git pull
cd infra/vm && docker compose -f docker-compose.prod.yml up -d --build
```

SPA updates: rebuild with `VITE_API_URL` set and `wrangler deploy` again.

## Notes

- Uploads persist in the `starterkit-app-storage` volume; Postgres data in
  `starterkit-postgres-data`. Back up with `docker run --rm -v <vol>:/d ...`
  or `pg_dump` before risky changes.
- Boot-time migrations are fine here (single app container).
- On AWS, the SSH security-group rule pinned to "My IP" goes stale when your
  IP changes — update it in the console if SSH stops connecting.
- Cloudflare Containers path (paid) remains documented in
  [deploy-cloudflare.md](deploy-cloudflare.md); `infra/api-worker/` is unused
  in this setup.
