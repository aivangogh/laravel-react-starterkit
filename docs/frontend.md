# Frontend (`apps/web`)

> **Status:** planned. This is the target design for the Vue 3 SPA in `apps/web`, using this
> kit's `@app/*` scope and Sanctum cookie auth.

Vue 3 SPA built with Vite. Single-page app with Pinia (client state) + TanStack Query (server state)
and Vue Router.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Vue 3 (`<script setup lang="ts">`, Composition API) |
| Build / dev server | Vite |
| Client state | Pinia (auth, UI flags — **not** server data) |
| Server state | TanStack Query (`@tanstack/vue-query`) |
| HTTP client | Axios (`apps/web/src/shared/lib/http.ts`) |
| Routing | Vue Router |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Components | shadcn-vue (consumed from `@app/ui`) |
| Icons | lucide-vue-next |
| Linting | oxlint (fast) → eslint (richer) |
| Formatting | Prettier |
| Unit tests | Vitest (jsdom) |
| E2E tests | Playwright |
| Type-check | vue-tsc (project-references) |

## Layout

Organized **by feature**, not by file type. Each feature owns its pages, composables, stores, tests.

```
apps/web/
  src/
    app/                      bootstrap — no domain logic
      App.vue
      main.ts                 createApp + Pinia + VueQueryPlugin + router
      router/index.ts         routes + auth/permission guard
      __tests__/              App.spec.ts (smoke test)
    shared/                   cross-feature primitives (used by 2+ features)
      lib/
        http.ts               axios instance (single source of all API calls)
        query-client.ts       QueryClient singleton (staleTime, retry policy)
        query-keys.ts         typed query key factories
      composables/
        usePermissions.ts     can()/hasRole() from the auth store
      directives/
        can.ts                v-can directive (show/hide by permission)
    features/                 one folder per feature, self-contained
      auth/
        pages/                LoginView.vue, RegisterView.vue, ForgotPasswordView.vue
        composables/          useAuth.ts
        stores/               auth.ts (Pinia — client state)
      users/
        pages/                UsersPage.vue, UserFormPage.vue
        composables/          useUsers.ts (TanStack Query)
      roles/  permissions/  activity-log/  profile/  settings/  api-tokens/
      ecommerce/              (stub — copied only for the E-commerce preset)
    assets/main.css           Tailwind entry; imports @app/ui globals
  e2e/                        Playwright specs
  public/
  index.html
  vite.config.ts
  vitest.config.ts
  playwright.config.ts
  eslint.config.ts
  .oxlintrc.json
```

**Rules of thumb**

- A file lives in `features/<x>/` if **only** feature `<x>` uses it.
- It lives in `shared/` if **two or more** features depend on it (or it's infra like the HTTP client).
- `app/` holds wiring only — no domain logic.
- Tests live next to the code they cover (per-feature `__tests__/`).

## Path aliases

| Alias | Resolves to | How |
| --- | --- | --- |
| `@/*` | `apps/web/src/*` | Vite alias + tsconfig `paths` |
| `@app/types` | `packages/types/src/index.ts` | workspace dep + tsconfig `paths` |
| `@app/ui/*` | `packages/ui/src/*` | Vite alias + tsconfig `paths` (consumed as source) |

Always use the package name — never relative paths across package boundaries:

```ts
import type { Paginated, ApiError, User } from '@app/types'
import { Button } from '@app/ui/components/ui/button'
```

## Scripts

Run from `apps/web/` (or `pnpm --filter web ...` from root):

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server with HMR |
| `pnpm build` | Type-checks then builds |
| `pnpm preview` | Serves the production build |
| `pnpm test:unit` | Vitest |
| `pnpm test:e2e` | Playwright |
| `pnpm type-check` | `vue-tsc --build` |
| `pnpm lint` | `oxlint --fix` then `eslint --fix --cache` |
| `pnpm format` | Prettier |

## Adding components

UI components live in `packages/ui`, not `apps/web/src/components`:

```bash
pnpm --filter @app/ui ui:add button
pnpm --filter @app/ui ui:add dialog dropdown-menu
```

```ts
import { Button } from '@app/ui/components/ui/button'
import { cn } from '@app/ui/lib/utils'
```

Rule of thumb: if it could be reused, put it in `@app/ui`. App-specific page layouts / feature views
stay in `apps/web/src/`.

## State management

| What | Tool | Where |
| --- | --- | --- |
| Auth session, UI flags, preferences | **Pinia** | `src/features/<x>/stores/` |
| API-fetched data (lists, details) | **TanStack Query** (`useQuery`) | `src/features/<x>/composables/use<Resource>.ts` |
| Writes (create/update/delete) | **TanStack Query** (`useMutation`) | same composable |
| Local component state | `ref` / `reactive` | inside the component |

**Rule:** server data that needs refetching → TanStack Query composable. Purely client-side state
(sidebar open? who is logged in?) → Pinia.

### Axios (`src/shared/lib/http.ts`)

Configured once with the API base URL, `withCredentials: true`, `Accept: application/json`, and
Sanctum CSRF handling. **Never** import `axios` directly in a component — import `http`:

```ts
import { http } from '@/shared/lib/http'
```

Sanctum cookie flow: call `GET /sanctum/csrf-cookie` before the first mutating request (the auth
composable handles this), then the session cookie authenticates subsequent requests.

### TanStack Query (`src/shared/lib/query-client.ts`)

A single `QueryClient` with project-wide defaults (e.g. 5-min stale time, no retry on 4xx), passed to
`VueQueryPlugin` in `app/main.ts`. Don't create new `QueryClient` instances elsewhere.

### Query composables (`src/features/<x>/composables/use<Resource>.ts`)

One composable file per resource inside its owning feature. Query keys come from
`src/shared/lib/query-keys.ts` — never inline strings.

```ts
// src/features/users/composables/useUsers.ts
import { useQuery } from '@tanstack/vue-query'
import type { User, Paginated } from '@app/types'
import { http } from '@/shared/lib/http'
import { userKeys } from '@/shared/lib/query-keys'

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => http.get<Paginated<User>>('/api/users').then((r) => r.data.data),
  })
}
```

### Pinia stores (`src/features/<x>/stores/`)

Only **non-server** state. `features/auth/stores/auth.ts` holds the logged-in user, a `ready` flag
for the router guard, and the flat permission list (from `/api/user`). Use setup-style stores; expose
state via `storeToRefs`.

## Permission-aware UI

The auth store exposes `can(permission)` / `hasRole(role)` from the permissions returned by
`/api/user`. Surfaced via:

- `src/shared/composables/usePermissions.ts` — `const { can } = usePermissions()`
- `src/shared/directives/can.ts` — `<button v-can="'users.create'">New</button>`
- Router guard reads `meta.permission` and redirects/403s when missing.

## Routing

`src/app/router/index.ts` — HTML5 history mode, one lazy-loaded route per feature page, an auth +
permission guard:

```ts
{
  path: '/users',
  component: () => import('@/features/users/pages/UsersPage.vue'),
  meta: { requiresAuth: true, permission: 'users.view' },
}
```

## Testing

- **Unit / component:** Vitest (jsdom), specs in per-feature `__tests__/`.
- **E2E:** Playwright in `apps/web/e2e/`.

Both run from root via `pnpm test:unit` / `pnpm test:e2e`.
