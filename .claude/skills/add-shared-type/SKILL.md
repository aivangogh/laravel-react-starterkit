---
name: add-shared-type
description: Add a TypeScript type to the shared `@app/types` package (`packages/types`) and consume it from the React web app, instead of redeclaring backend shapes in the frontend. Use when a DTO, enum, or API contract surface is needed by both the Laravel response layer and the SPA.
---

# add-shared-type

Adds a hand-authored type to `packages/types` (package name **`@app/types`**) so the FE and BE share
one contract. The web app consumes it via the package — never by duplication.

## When to use

- A new API endpoint returns a shape the frontend will consume.
- A common primitive (branded id, enum, status) is introduced.
- You're about to redeclare a backend shape inside `apps/web`.

## When NOT to use

- The type is purely internal to one app (component-local props, internal store state) — keep it local.
- The type should be generated. In that case emit into `packages/types/src/generated/` and re-export
  from `index.ts` (the generated dir is off-limits to hand edits).

## Steps

1. Open `packages/types/src/index.ts`. Follow existing patterns:
   - Branded primitives: `export type Uuid = string & { readonly __brand: 'Uuid' }`,
     `IsoDateTime`.
   - Envelope: `Paginated<T>` (matches Laravel's `{ data, meta, links }`), `ApiError`
     (`{ message, errors? }`).
   - Domain: `User`, `Role`, `Permission` already exist — extend these before inventing new shapes.
2. Add the type. Prefer `Paginated<NewType>` over redefining the envelope.
3. If large/domain-specific, create a sibling file (e.g. `src/products.ts`) and re-export from
   `index.ts`.
4. Consume it in `apps/web` via the package, never a relative path:
   ```ts
   import type { User, Paginated } from '@app/types'
   ```
5. Type-check: `pnpm type-check` (or `pnpm --filter @app/types type-check`).

## Conventions

- Hand-authored types live next to `index.ts`; generated types under `src/generated/` (re-exported,
  never hand-edited).
- Branded aliases (`Uuid`, `IsoDateTime`) beat plain `string` for ids/timestamps.
- **Types only — no runtime code** in this package. Runtime guards belong in the consumer.
- Keep the TS type in lockstep with the Laravel **API Resource** that produces it (see
  `new-api-endpoint`). When the Resource shape changes, update the type in the same change.

## Don't

- Don't `import type { X } from '@app/types/src/...'` — import from the package root (`@app/types`).
- Don't redeclare a backend shape inside `apps/web/src/**`.
