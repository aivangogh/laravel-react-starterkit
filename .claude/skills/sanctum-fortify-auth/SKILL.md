---
name: sanctum-fortify-auth
description: How first-party auth works in this repo — Laravel Fortify (headless actions) + Sanctum SPA cookie sessions — and how to add to, change, or test it. Use when touching login/register/logout, password reset, email verification, 2FA, CSRF/CORS, session config, the SPA session user (`useUser` / `userQueryOptions`), or any `auth:sanctum`-protected route. Repo-specific; auth is wired and verified.
---

# sanctum-fortify-auth

The backend authenticates the decoupled React SPA with **Sanctum SPA cookie sessions**, and performs the
auth *actions* (login, register, reset, verify, 2FA) with **headless Fortify**. No JWT; the session
cookie carries auth. This is wired and verified end-to-end (CSRF → register → authenticated `/api/user`).

## The flow

```
SPA (origin http://localhost:5174)            API (http://localhost:8000)
  GET  /sanctum/csrf-cookie   ───────────────▶  sets XSRF-TOKEN + session cookie
  POST /login | /register     ───────────────▶  Fortify authenticates, starts the web session
  GET  /api/user              ───────────────▶  returns the authenticated user (auth:sanctum)
```

- Browser/axios reads the `XSRF-TOKEN` cookie and sends it **url-decoded** as the `X-XSRF-TOKEN`
  header on mutating requests. Axios does this automatically with `withCredentials: true`.
- `/api/*` requests count as authenticated when the request Origin is in `SANCTUM_STATEFUL_DOMAINS`
  and a valid session cookie is present (`$middleware->statefulApi()` in `bootstrap/app.php`).

## Where the wiring lives

| Concern | File |
|---|---|
| Stateful API middleware + Spatie aliases | `backend/bootstrap/app.php` (`->withMiddleware`) |
| CORS (credentials, SPA origin, paths) | `backend/config/cors.php` (`supports_credentials = true`) |
| Fortify (headless, features) | `backend/config/fortify.php` (`'views' => false`) |
| Fortify actions | `backend/app/Actions/Fortify/*` |
| Sanctum | `backend/config/sanctum.php` |
| User auth traits | `backend/app/Models/User.php` (`HasApiTokens`, `TwoFactorAuthenticatable`) |
| Env | `backend/.env` — `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN=localhost`, `FRONTEND_URL` |

`/api/user` lives in `backend/routes/api.php`. Fortify routes (`POST /login`, `/register`, `/logout`,
`/forgot-password`, `/reset-password`, `/email/...`, `/user/two-factor-*`) are registered automatically
— **no view routes** because `views => false`. List them with `php artisan route:list` (run on PHP 8.4).

## Non-obvious rules (these bite)

- **Cookies are scoped to `SESSION_DOMAIN=localhost`.** Test/serve against `http://localhost:<port>`,
  **not** `127.0.0.1` — a `localhost`-domain cookie won't round-trip to `127.0.0.1`.
- **Add new SPA origins to `SANCTUM_STATEFUL_DOMAINS`** (host:port) AND to `config/cors.php`
  `allowed_origins`. Missing either breaks the cookie flow with a silent 401 or CORS error.
- **API serve port:** `php artisan serve` defaults to 8000, which may be taken — use a free port
  (e.g. `--port=8001`). The stateful check is about the *frontend* Origin, not the API port.
- **JSON responses:** Fortify returns JSON (201/200/204 + 422 on validation) when the request sends
  `Accept: application/json`. The SPA must send it.
- **Hidden fields:** `password`, `remember_token`, `two_factor_secret`, `two_factor_recovery_codes`
  are in `$hidden` on `User`. Keep new secrets hidden.

## Adding / changing auth behavior

- **New auth action** → customize the relevant `app/Actions/Fortify/*` class; don't hand-roll a
  controller that duplicates Fortify.
- **Enforce email verification** → make `User implements MustVerifyEmail` (currently the feature is
  enabled but not enforced).
- **Protect a route** → `Route::middleware('auth:sanctum')` (+ `permission:*`, see the
  `new-api-endpoint` skill).

## Smoke-test the flow (curl)

Run the API on a free port, then (PHP 8.4 on PATH for the url-decode helper):

```bash
JAR=$(mktemp); BASE=http://localhost:8001; ORIGIN=http://localhost:5174
curl -s -c "$JAR" -H "Origin: $ORIGIN" "$BASE/sanctum/csrf-cookie" -o /dev/null -w "%{http_code}\n"   # 204
TOKEN=$(php -r 'echo urldecode($argv[1]);' "$(awk '$6=="XSRF-TOKEN"{print $7}' "$JAR")")
curl -s -c "$JAR" -b "$JAR" -H "Origin: $ORIGIN" -H "Accept: application/json" \
  -H "Content-Type: application/json" -H "X-XSRF-TOKEN: $TOKEN" \
  -X POST "$BASE/register" \
  --data '{"name":"A","email":"a@example.com","password":"password123","password_confirmation":"password123"}' \
  -w "\n%{http_code}\n"                                                                                 # 201
curl -s -b "$JAR" -H "Origin: $ORIGIN" -H "Accept: application/json" "$BASE/api/user" -w "\n%{http_code}\n"  # 200
```

## Frontend side (apps/web)

- A single axios instance (`src/shared/lib/http.ts`) with `withCredentials: true` + `withXSRFToken`;
  auth mutations call `ensureCsrfCookie()` (`/sanctum/csrf-cookie`) before posting.
- The session user is **TanStack Query state**, not a store: `userQueryOptions` (key
  `authKeys.user()`, `GET /api/user`, 401/419 → `null`) in `src/features/auth/hooks/useAuth.ts`.
  Components read it with `useUser()`; after a self-mutation call `useRefreshUser()`. Login/register
  mutations refresh it; logout clears the whole query cache and sets it to `null`.
- Route guards read the same cache: `routes/_app.tsx` (`ensureQueryData(userQueryOptions)`, redirect
  to `/login?redirect=…`) and `routes/_guest.tsx` (logged-in visitors go to `/`).
- `main.tsx` adds a response interceptor: a 401 mid-session clears the cache + user and re-runs the
  guards (→ `/login`); a 419 resets the CSRF cookie so the next write re-primes it.

See `docs/frontend.md` and the `frontend-architecture` skill.

## Don't

- Don't store tokens in `localStorage` for first-party auth — cookies are the design (XSS-safe).
- Don't disable CSRF or set `supports_credentials = false` to "make it work".
- Don't test the cookie flow against `127.0.0.1` when `SESSION_DOMAIN=localhost`.
