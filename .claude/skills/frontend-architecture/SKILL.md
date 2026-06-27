---
name: frontend-architecture
description: Frontend architecture rules and component-reuse discipline for the Vue 3 SPA. Use when creating, modifying, or reviewing any Vue component, page, store, composable, form, or styling in `apps/web` or `packages/ui` — to keep the SPA composable, prevent duplication between `apps/web` and `packages/ui` (`@app/ui`), and enforce the shadcn-vue + Tailwind v4 + TanStack Query + Pinia conventions. Triggers: "add a component", "build a UI", "create a page", "make a form", "style this", "design the dashboard", any change that adds or moves a `.vue`/`.ts` file under `apps/web/src` or `packages/ui/src`.
---

# Frontend architecture (Vue 3 + shadcn-vue + Tailwind v4 + TanStack Query)

The SPA must stay **composable**, **portable**, and **boring** — every piece obvious to find, easy to
reuse, easy to delete. This encodes the conventions in `docs/frontend.md`.

> **Status:** `apps/web` is built in **Phase 5** (`docs/roadmap.md`). `packages/ui` (`@app/ui`),
> `packages/types` (`@app/types`), and `packages/config` (`@app/config`) exist now. Apply these rules
> when creating `apps/web`, and to anything under `packages/ui` today.

## TL;DR

1. **Reusable UI lives in `packages/ui` (`@app/ui`) only.** Never duplicate a shadcn-vue component into `apps/web`.
2. **Build by composition, not duplication.** Check `packages/ui/src/components/ui` and `…/components` first; extend or compose.
3. **`packages/ui` is portable** — its components must not import from any app, store, or API client. Props in, events out.
4. **Use design tokens.** Colors/radii/spacing come from CSS vars in `packages/ui/src/styles/globals.css`. Never hardcode hex/`bg-zinc-*` in a component.
5. **Strict types**, lazy-loaded routes, server-validation errors surfaced as Alerts. No raw `axios` in components.
6. **TanStack Query owns server state. Pinia owns client state.** Never put API-fetched data in a Pinia store.

## Layer map

Organized **by feature**, not by file type.

```
apps/web/src/
├── app/                    # bootstrap — no domain logic
│   ├── App.vue
│   ├── main.ts             #   createApp + Pinia + VueQueryPlugin + router
│   └── router/index.ts     #   routes + auth/permission guard
├── shared/                 # cross-feature primitives (used by 2+ features)
│   ├── lib/
│   │   ├── http.ts         #     axios instance (single source of API base URL + headers + CSRF)
│   │   ├── query-client.ts #     QueryClient singleton
│   │   └── query-keys.ts   #     typed query key factories
│   ├── composables/        #   e.g. usePermissions.ts (can()/hasRole())
│   ├── directives/         #   e.g. can.ts (v-can)
│   ├── components/         #   app-local shared (not yet generic enough for @app/ui)
│   └── layouts/            #   AuthLayout, DashboardLayout (if shared by 2+ features)
├── features/               # one folder per feature, self-contained
│   └── <feature>/
│       ├── pages/          #     <Feature>Page.vue (route lazy-loaded)
│       ├── composables/    #     use<Resource>.ts (TanStack Query)
│       ├── stores/         #     <feature>.ts (Pinia — client state only)
│       ├── components/     #     feature-only composites
│       └── __tests__/      #     Vitest specs
└── assets/main.css         # imports @app/ui globals.css

packages/ui/src/            # @app/ui — consumed as source via the @app/ui alias
├── components/ui/          # shadcn-vue primitives (CLI writes here)
├── components/             # higher-level reusable composites
├── composables/            # HEADLESS hooks only (no I/O)
├── lib/utils.ts            # cn()
└── styles/globals.css      # Tailwind v4 entry + design tokens
```

Rules of thumb:
- A file lives in `features/<x>/` if **only** feature `<x>` uses it.
- It moves to `shared/` if **2+** features depend on it (or it's infra like the HTTP client).
- `app/` holds wiring only.
- Tests live next to the code they cover.

## "Where does this go?" decision tree

```
Is it an entire URL/screen?
├── Yes → apps/web/src/features/<feature>/pages/<Feature>Page.vue   (route lazy-loaded)
└── No → continue ↓
Could another app/feature reuse this exact piece?
├── Yes, a primitive (button-like) → `pnpm dlx shadcn-vue@latest add <name>` (lands in packages/ui/src/components/ui)
├── Yes, a composite (StatCard, EmptyState, PageHeader, DataTable) → packages/ui/src/components/<Name>.vue
└── No, only this app's domain → continue ↓
Used by exactly one feature?
├── Yes → apps/web/src/features/<feature>/components/<Name>.vue
└── No, 2+ features → apps/web/src/shared/components/<Name>.vue
```

If reusable cross-app but placed under `apps/web/`, it's wrong → move to `packages/ui` and import via
`@app/ui/components/<Name>`. If single-feature but placed in `shared/`, also wrong → move into the feature.

## Reuse-first workflow (mandatory)

Before creating a component:
1. `ls packages/ui/src/components/ui/` — does shadcn already ship a primitive?
2. `ls packages/ui/src/components/` — does a composite exist?
3. If shadcn ships it: `pnpm dlx shadcn-vue@latest add <component>` (writes to `packages/ui` via its `components.json`).
4. Search the [shadcn-vue registry](https://shadcn-vue.com/docs/components) for a near-fit before building.
5. Only then build new. Place it in `packages/ui/src/components/` if reusable, `apps/web/src/...` if app-specific.

## Component conventions

```vue
<script setup lang="ts">
import type { HTMLAttributes } from 'vue'      // 1. type imports
import { computed } from 'vue'                  // 2. vue / 3rd-party
import { Button } from '@app/ui/components/ui/button'  // 3. @app/* (workspace shared)
import { cn } from '@app/ui/lib/utils'
import { useAuth } from '@/features/auth/composables/useAuth'  // 4. @/* (this app)

interface Props { title: string; class?: HTMLAttributes['class'] }
const props = defineProps<Props>()
const emit = defineEmits<{ submit: [payload: { id: string }] }>()
</script>
<template>
  <section :class="cn('rounded-lg border p-4', props.class)">…</section>
</template>
```

- Always `<script setup lang="ts">`, Composition API.
- Type props/emits via `defineProps<Props>()` / `defineEmits<{ e: [args] }>()` — never the array form.
- Accept `class?: HTMLAttributes['class']` and merge with `cn()`.
- Keep SFCs under ~250 lines; one responsibility each.

### Import sources

| Source | Use |
|---|---|
| `@app/ui/components/ui/<x>` | shadcn-vue primitives |
| `@app/ui/components/<X>` | shared composites |
| `@app/ui/composables/<x>` | headless hooks |
| `@app/ui/lib/utils` | `cn`, etc. |
| `@app/types` | shared API contract types |
| `@/features/<f>/...` | feature-local |
| `@/shared/...` | cross-feature, app-local |

**Never** import `@/` paths inside `packages/ui/*` (breaks portability — verify with
`grep -rn "from '@/" packages/ui/src/`, should be empty).

## State management

| Use case | Tool | Where |
|---|---|---|
| Local reactive state | `ref`/`reactive` | in the component |
| Headless reusable logic (no I/O) | composable | `packages/ui/src/composables/` |
| App logic for one feature | composable | `apps/web/src/features/<f>/composables/` |
| **Server data** (fetched) | **TanStack Query** `useQuery` | `apps/web/src/features/<f>/composables/use<Resource>.ts` |
| **Writes** | **TanStack Query** `useMutation` | same file |
| **Client-only state** (auth user, UI flags) | **Pinia** | `apps/web/src/features/<f>/stores/` |

**Hard rule:** server data → TanStack Query composable, never a Pinia store.

- **Axios:** one instance at `src/shared/lib/http.ts` (`withCredentials: true`, CSRF, `Accept: application/json`). Import as `http`; never raw `axios` in a component. See `sanctum-fortify-auth`.
- **Query keys:** all in `src/shared/lib/query-keys.ts`. Never inline strings.
- **Pinia:** setup-style stores; expose via `storeToRefs`. Only `features/auth/stores/auth.ts` (user + `ready` flag the router guard reads synchronously) and per-feature UI state.

## Styling

- Tailwind v4 utilities only. Tokens via CSS vars (`bg-primary`, `text-muted-foreground`, `border-border`) — never `#fff`/`bg-zinc-700`.
- Merge consumer `class` with `cn()`. Dark mode via `.dark` on a parent (`@custom-variant dark`).
- No unscoped `style` in shared components; no `v-html` on user input.

## Routing

- Lazy-load every page: `component: () => import('@/features/<f>/pages/<X>Page.vue')`.
- Auth via route meta (`meta: { requiresAuth: true, permission: 'users.view' }`) read by the single global `beforeEach` guard. Don't sprinkle guards.
- Use named routes: `router.push({ name: 'login' })`, not string paths.

## Anti-patterns (refuse to write)

- A second `Button.vue` in `apps/web` (there's exactly one, in `@app/ui`).
- A shadcn primitive copied into `apps/web/src/components/ui/` (CLI writes to `packages/ui`).
- `axios.get(...)`/`fetch(...)` inside a component (use a Query composable).
- API-fetched data in a Pinia store.
- Inline query-key strings; hardcoded API URLs; magic route strings.
- One feature importing another feature's internals (extract to `@/shared/` or `@app/ui`).
- `@/...` imports inside `packages/ui`.

## After-write commands

```bash
pnpm --filter web type-check
pnpm --filter web lint
pnpm --filter web test:unit       # if a unit test was added
```

## Related skills

`ui-reuse-first` (when to stop and reuse), `add-shared-type`, `sanctum-fortify-auth`, `new-api-endpoint`.
