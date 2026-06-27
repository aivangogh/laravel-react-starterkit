---
name: redis-caching
description: Apply the project's Redis caching strategy in the Laravel backend — cache-aside reads, invalidate-on-write (post-commit) via Observers, TTL with jitter, negative caching, and graceful degradation when Redis is down. Use when adding/modifying any controller, query, model, or job that reads or writes data a user could see more than once. Triggers: "cache this", "use Redis", "speed up this query", "invalidate cache", "rate limit", or any read-heavy endpoint.
---

# redis-caching

This repo runs **Redis 7** (host port 6381) alongside **Postgres 17** (host port 5434) — see
`docker-compose.yml` and `docs/local-stack.md`. Postgres is the source of truth; Redis is a derived
view that must stay optional for correctness — if Redis disappears, the app is slower but still right.

> **Client:** this kit uses **`predis`** (`REDIS_CLIENT=predis`) because the PHP 8.4 build has no
> `phpredis` extension. For production throughput, installing the `phpredis` C extension and switching
> the client is a valid optimization — but the strategy below is identical either way.

## TL;DR

1. **Reads** use cache-aside (`Cache::remember`).
2. **Writes** commit to Postgres first, **then delete** the affected keys (don't update them).
3. **Every key has a TTL** with random jitter; nothing lives forever (`rememberForever` is banned — use 24h).
4. **Invalidation lives in Model Observers**, fired on `saved`/`deleted` (post-commit).
5. **Degrade gracefully** if Redis is down: log + fall through to Postgres.
6. **Cache the API Resource array**, never an Eloquent model.
7. **Keys are namespaced + scoped + versioned**: `app:<env>:<resource>:<scope>:<id>:v<n>`.

## Why delete, not update

Updating DB + cache in the same path races: a slow reader can write a stale value back after a newer
write. `Cache::forget` sidesteps it — the next reader re-populates from Postgres. Always invalidate by
deletion.

## Why post-commit

Invalidating on `saving` (pre-commit) breaks on rollback. Use `saved`/`deleted`/`restored`. Inside an
explicit `DB::transaction(...)`, dispatch via `DB::afterCommit(fn () => ...)`.

## When to cache

**Yes:** read-heavy lookup tables (roles, settings), index/list endpoints (read ≫ write), aggregates/
dashboards, API Resource payloads keyed by `(resource, id, version)`, dropdown reference data.

**No:** session state (the session driver handles it), strong-consistency data (audit logs, money),
read-your-writes where the user expects instant visibility, queries already <5ms p99, payloads >256KB,
anything with secrets/PII unless the store is equally protected.

## Key format

```
app:<env>:<resource>:<scope>:<id-or-hash>:v<version>
# app:local:user:show:42:v1   ·   app:local:role:list:all:v1
```

- App prefix `app:` (set `CACHE_PREFIX` per env). Environment segment so a shared Redis can host envs.
- **Tenant/user scope is mandatory** for any per-user payload — forgetting it leaks data across users.
- Bump `v<n>` whenever the payload shape changes (Resource changed / `@app/types` contract changed).
  Old keys age out via TTL — no migration.
- Never put PII in the key. Hash inputs >80 chars with `sha1()`.

## TTL with jitter

| Data | Base TTL | Jitter |
|---|---|---|
| Reference/config | 24h | ±2h |
| List/index | 5–15m | ±1m |
| Per-user dashboard | 1–5m | ±30s |

```php
$ttl = 15 * 60 + random_int(-60, 60);   // ±10% jitter avoids synchronized expiry herds
```

## Read path

```php
$key = "app:".config('app.env').":user:show:{$id}:v1";
$payload = Cache::remember($key, $this->ttlWithJitter(900, 60), fn () =>
    UserResource::make(User::with('roles')->findOrFail($id))->resolve()   // resolved ARRAY, not the model
);
return UserResource::make($payload);
```

Negative caching for id lookups (stops bots hammering Postgres on misses):
```php
$payload = Cache::remember($key, 60, fn () => User::find($id)?->toResourceArray() ?? '__NOT_FOUND__');
if ($payload === '__NOT_FOUND__') abort(404);
```

## Write path — Observer, post-commit

```php
class UserObserver {
    public function saved(User $u): void   { DB::afterCommit(fn () => $this->invalidate($u)); }
    public function deleted(User $u): void  { DB::afterCommit(fn () => $this->invalidate($u)); }
    private function invalidate(User $u): void {
        Cache::forget("app:".config('app.env').":user:show:{$u->id}:v1");
    }
}
// register in App\Providers\AppServiceProvider::boot():  User::observe(UserObserver::class);
```

`saved` covers create+update; add `restored` for SoftDeletes. Jobs/console commands that mutate via
Eloquent invalidate automatically. Raw `DB::statement(...)` bypasses events — invalidate manually +
add a regression test.

## Failover

If Redis is unreachable the app must still serve (slower). On user-facing critical paths, wrap the
read and fall through:
```php
try { $payload = Cache::remember($key, $ttl, $compute); }
catch (\Throwable $e) { report($e); $payload = $compute(); }
```
Use sparingly. Never put data in Redis that isn't also in Postgres.

## Rate limiting

Use the `RateLimiter` facade (Redis-backed) for API throttling and auth brute-force protection. Keep
rate-limit counters in a separate logical DB from the cache so eviction can't drop them mid-window.

## Anti-patterns (never)

1. Cache an Eloquent model directly (cache the Resource array).
2. Update the cache on write instead of deleting it.
3. Invalidate pre-commit (`saving`) instead of post-commit (`saved`).
4. `rememberForever` on user-visible data (24h max).
5. Cache inside a `DB::transaction` (use `DB::afterCommit`).
6. Per-user payload with a non-user-scoped key (data leak).
7. `KEYS app:*` in production (blocks Redis — use `SCAN` or tags).

## Testing

- Unit tests use the `array` cache driver (fast, deterministic). Don't mock the `Cache` facade —
  assert real behavior (`Cache::has`/`get`).
- Add one test that asserts an Observer fires `Cache::forget` after an update.
- Run backend tests on **PHP 8.4** with the stack up (`pnpm db:up`).
