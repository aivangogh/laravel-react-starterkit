# Shared Packages (`packages/*`)

> **Status:** scaffolded (Phase 0). The three internal packages under the `@app/*` scope exist and
> are installed as pnpm workspace members. The Laravel backend is **not** a member. (`@app/ui`
> holds the shadcn/ui components consumed by `apps/web`.)

## `@app/config`

**Path:** `packages/config` — single source of truth for ESLint, Prettier, and TypeScript bases.

Exports (from `package.json`):

| Subpath | File |
| --- | --- |
| `@app/config/eslint` | `eslint.base.mjs` |
| `@app/config/prettier` | `prettier.base.json` |
| `@app/config/tsconfig.base.json` | `tsconfig.base.json` |
| `@app/config/tsconfig.react.json` | `tsconfig.react.json` |

Apps and packages extend these instead of defining their own. Project-wide rule changes happen here
so every workspace inherits them. No build/lint/format steps of its own (no-op scripts).

## `@app/types`

**Path:** `packages/types` — hand-authored + generated TypeScript types shared between FE and BE.

```
packages/types/
  src/
    index.ts          hand-authored types + re-exports
    generated/
      index.ts        re-exports from per-resource generated files
```

Hand-authored baseline (`index.ts`):

```ts
export type Uuid = string & { readonly __brand: 'Uuid' }
export type IsoDateTime = string & { readonly __brand: 'IsoDateTime' }

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}
export interface ApiError { message: string; errors?: Record<string, string[]> }

// kit domain types
export interface Role { id: number; name: string; permissions: string[] }
export interface User {
  id: number; name: string; email: string
  roles: string[]; permissions: string[]
}
```

### Rules

- **Generated files are off-limits to humans** — anything under `src/generated/` is emitted by a
  backend generator (e.g. `spatie/laravel-typescript-transformer`). Edit the source, not the output.
- **Re-export from `index.ts`** — consumers always `import { X } from '@app/types'`, never reach into
  `@app/types/src/...`.
- **Branded primitives** — use the `Uuid` / `IsoDateTime` brand pattern for meaningful aliases.

## `@app/ui`

**Path:** `packages/ui` — shared design system: shadcn/ui (Base UI) components, the `DataTable`, plus design tokens.

```
packages/ui/
  components.json    shadcn config (style: base-nova, base: neutral, icons: lucide)
  src/
    components/      composite components (data-table/: DataTable, DataTableSortHeader)
    components/ui/   raw shadcn-generated components
    hooks/           headless React hooks
    lib/utils.ts     cn() helper, etc.
    styles/globals.css  Tailwind layer / CSS variables
```

### Consumed as source, not built

`@app/ui` exports nothing from `package.json`; apps consume it via a Vite path alias:

```ts
// apps/web/vite.config.ts
'@app/ui': fileURLToPath(new URL('../../packages/ui/src', import.meta.url)),
```

Changes are picked up instantly via HMR — no build step. The `build` script is a no-op.

### Adding components

```bash
pnpm --filter @app/ui ui:add button
pnpm --filter @app/ui ui:add dialog dropdown-menu
```

| Alias | Path |
| --- | --- |
| `components` | `@app/ui/components` |
| `hooks` | `@app/ui/hooks` |
| `utils` | `@app/ui/lib/utils` |
| `ui` | `@app/ui/components/ui` |
| `lib` | `@app/ui/lib` |

### Imports from apps

```ts
import { Button } from '@app/ui/components/ui/button'
import { cn } from '@app/ui/lib/utils'
```

### Styles

`packages/ui/src/styles/globals.css` is the canonical Tailwind layer with shadcn CSS variables. Apps
import it from their global stylesheet (e.g. `apps/web/src/assets/main.css`).

## When to add a new package

Add a package when **two or more apps** need to share code. For one-app code, keep it in that app —
don't pre-extract.

1. Create `packages/<name>/` with a `package.json` named `@app/<name>`.
2. Add a `tsconfig.json` extending `@app/config/tsconfig.base.json`.
3. Add `lint` / `format` / `build` / `type-check` scripts (no-op stubs are fine).
4. The `packages/*` glob in `pnpm-workspace.yaml` picks it up on next `pnpm install`.
