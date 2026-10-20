# Frontend (`apps/web`)

React 19 SPA built with Vite. TanStack Router (file-based routes) for routing, TanStack Query for all
server state (including the session user), Sanctum cookie auth against the Laravel API.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 (function components, hooks) |
| Build / dev server | Vite (`@vitejs/plugin-react`) |
| Routing | TanStack Router — file-based (`@tanstack/router-plugin`, auto code-splitting) |
| Server state | TanStack Query (`@tanstack/react-query`) — includes the session user |
| Client state | Component state only; no store library (add zustand if real cross-component client state appears) |
| Search-param validation | Valibot (route `validateSearch`) |
| HTTP client | Axios (`apps/web/src/shared/lib/http.ts`) |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Components | shadcn/ui on Base UI (`@base-ui/react`, style `base-nova`), consumed from `@app/ui` |
| Tables | `@tanstack/react-table` v8 via `@app/ui` `DataTable` |
| Icons | lucide-react |
| Linting | ESLint (`@app/config/eslint`: typescript-eslint + react-hooks + react-refresh) |
| Formatting | Prettier |
| Unit tests | Vitest (jsdom) + React Testing Library |
| E2E tests | Playwright |
| Type-check | `tsc --noEmit` (extends `@app/config/tsconfig.react.json`) |

## Layout

Organized **by feature**, not by file type. Each feature owns its pages, hooks, components, tests;
route files under `src/routes/` are thin wiring.

```
apps/web/
  src/
    main.tsx                  createRoot + QueryClientProvider + RouterProvider; 401/419 interceptor
    router.tsx                createRouter({ routeTree, context: { queryClient } })
    routeTree.gen.ts          generated from src/routes/ by the Vite plugin — never edit
    routes/
      __root.tsx              root layout, not-found → '/', error boundary
      _app.tsx                authenticated shell (DashboardLayout) + the single guard
      _app/                   index ('/'), users, roles, tokens, activity, settings, profile, forbidden
      _guest.tsx              logged-out-only shell
      _guest/                 login, register, forgot-password, reset-password
    shared/                   cross-feature primitives (used by 2+ features)
      lib/
        http.ts               axios instance (single source of all API calls) + CSRF helpers
        query-client.ts       QueryClient singleton (staleTime, retry policy)
        query-keys.ts         typed query key factories
        form.ts               formValues(), formErrors()
        permissions.ts        can(user, permission) — the canonical rule
      hooks/                  usePermissions, useServerTable, useAppConfig, useNavItems
      components/             Can, FormField, AppSidebarNav
      layouts/                AuthLayout, DashboardLayout
      router/types.ts         typed route staticData + NavItem
    features/                 one folder per feature, self-contained
      auth/                   hooks/useAuth.ts (session user + auth mutations), pages/
      users/                  hooks/useUsers.ts, pages/UsersPage.tsx, components/, __tests__/
      roles/  tokens/  activity/  profile/  settings/  home/
    test/utils.tsx            renderWithQuery, renderHookWithQuery, createTestQueryClient
    assets/main.css           Tailwind entry; imports @app/ui globals
  stubs/modules/              optional install modules (see docs/modules.md)
  e2e/                        Playwright specs
  index.html
  vite.config.ts  vitest.config.ts  playwright.config.ts  eslint.config.mjs
```

**Rules of thumb**

- A file lives in `features/<x>/` if **only** feature `<x>` uses it.
- It lives in `shared/` if **two or more** features depend on it (or it's infra like the HTTP client).
- Route files hold `staticData`, `validateSearch` and `component` only — page UI lives in `features/<x>/pages/`.
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
| `pnpm dev` | Vite dev server with HMR (regenerates the route tree) |
| `pnpm build` | Builds, then `tsc --noEmit` |
| `pnpm preview` | Serves the production build |
| `pnpm test:unit` | Vitest |
| `pnpm test:e2e` | Playwright |
| `pnpm type-check` | `tsc --noEmit` |
| `pnpm lint` | `eslint .` |
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

The primitives are the Base UI flavour of shadcn/ui: there is no `asChild` — compose with the `render`
prop (`<DropdownMenuTrigger render={<Button variant="ghost" />}>`, `<Button render={<Link to="/" />}
nativeButton={false}>`). Read the component file before using it.

Rule of thumb: if it could be reused, put it in `@app/ui`. App-specific page layouts / feature views
stay in `apps/web/src/`.

## State management

| What | Tool | Where |
| --- | --- | --- |
| Session user | **TanStack Query** (`userQueryOptions`, key `authKeys.user()`) | `src/features/auth/hooks/useAuth.ts` |
| API-fetched data (lists, details) | **TanStack Query** (`useQuery`) | `src/features/<x>/hooks/use<Resource>.ts` |
| Writes (create/update/delete) | **TanStack Query** (`useMutation`) | same hook file |
| URL state (redirect target, reset token) | Route `validateSearch` (Valibot) | route file |
| Local component state | `useState` / `useReducer` | inside the component |

### Axios (`src/shared/lib/http.ts`)

Configured once with the API base URL, `withCredentials: true`, `withXSRFToken: true`,
`Accept: application/json`. **Never** import `axios` directly in a component — import `http`:

```ts
import { http } from '@/shared/lib/http'
```

Sanctum cookie flow: mutations call `ensureCsrfCookie()` (`GET /sanctum/csrf-cookie`, once) before
posting; the session cookie authenticates subsequent requests. `main.tsx` registers a response
interceptor: a **401** while a user is cached clears the query cache, sets the user to `null` and
re-runs the route guards (→ `/login`); a **419** resets the CSRF cookie so the next write re-primes it.

### TanStack Query (`src/shared/lib/query-client.ts`)

A single `QueryClient` (5-min stale time, no retry on 4xx, no mutation retry), provided in `main.tsx`
and passed to the router context so guards can `ensureQueryData` from the same cache. Don't create
new `QueryClient` instances elsewhere (tests use `createTestQueryClient()`).

### Query hooks (`src/features/<x>/hooks/use<Resource>.ts`)

One hook file per resource inside its owning feature. Query keys come from
`src/shared/lib/query-keys.ts` — never inline strings.

```ts
// src/features/users/hooks/useUsers.ts
export function useUsersTable() {
  return useServerTable<User>({ resource: 'users', endpoint: '/api/users' })
}
```

### Session user (`src/features/auth/hooks/useAuth.ts`)

`userQueryOptions` fetches `GET /api/user` (401/419 → `null`) with `staleTime: Infinity`. Components
read it with `useUser()` (`User | null`); after changing the current user (profile, avatar) call
`useRefreshUser()`. `useLogin`/`useRegister` refresh it; `useLogout` clears the whole cache.

## Tables

`useServerTable<T>({ resource, endpoint })` owns pagination/sort/search state and the list query; it
is the single definition of the list-endpoint params (`page`, `per_page`, `sort`, `dir`, `q`). Spread
its `tableProps` into the `@app/ui` `DataTable`:

```tsx
const { data, tableProps } = useUsersTable()
<DataTable columns={columns} data={data} {...tableProps} toolbar={…} />
```

Sortable headers: `header: ({ column }) => <DataTableSortHeader column={column} label="Name" />`.

## Forms

- `<FormField label htmlFor error hint>` renders the label, control (`children`), hint and error.
- `formErrors(mutation.error)` → `{ fields, alert }`: the first 422 message per field, or a top-level
  message when there are no field errors. Show `alert` in `<Alert variant="destructive">`.
- `formValues(form)` reads an uncontrolled form's fields; forms with pre-fill or checkboxes use `useState`.

## Permission-aware UI

`can(user, permission)` in `src/shared/lib/permissions.ts` is the single rule (super-admin bypass
included), fed by the `permissions` array from `/api/user`. Surfaced via:

- `usePermissions()` — `const { can, hasRole } = usePermissions()`; use `disabled={!can('x')}` to keep a control visible but inert.
- `<Can permission="users.create"><Button>New user</Button></Can>` — renders `fallback` (default nothing) without the permission.
- The `_app` route guard reads `staticData.permission` and redirects to `/forbidden`.

## Routing

Routes are files under `src/routes/`; the Vite plugin generates `src/routeTree.gen.ts` and code-splits
each route component.

- `_app.tsx` is the authenticated shell and the **single guard**: it ensures the session user (else
  `redirect` to `/login?redirect=<href>`), then for every matched route checks `staticData.module`
  (disabled module → `/`) and `staticData.permission` (missing → `/forbidden`). Pages never add their
  own `beforeLoad` for auth.
- `_guest.tsx` wraps login/register/password-reset and sends logged-in visitors to `/`.
- Search params are validated with Valibot: `/login?redirect` (in-app paths only),
  `/reset-password?token&email`.
- The sidebar is derived from routes that set `staticData.nav` (`useNavItems`), filtered by
  permission and enabled module — no hand-maintained nav list.

```tsx
// src/routes/_app/users.tsx
export const Route = createFileRoute('/_app/users')({
  staticData: {
    permission: 'users.view',
    nav: { title: 'Users', icon: Users, order: 10 },
  },
  component: UsersPage,
})
```

## Testing

- **Unit / component:** Vitest (jsdom) + React Testing Library + `user-event`, specs in per-feature
  `__tests__/`. `src/test/utils.tsx` provides `renderWithQuery` / `renderHookWithQuery`; mock
  `@/shared/lib/http` for hook specs.
- **E2E:** Playwright in `apps/web/e2e/`.

Both run from root via `pnpm test:unit` / `pnpm test:e2e`.
