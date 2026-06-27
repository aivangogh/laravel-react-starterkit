---
name: ui-reuse-first
description: Reuse-first UI/UX discipline for the Vue 3 SPA. Use before writing any `.vue` markup, designing new UI surfaces, or reviewing changes that add inline markup. Enforces "look for an existing component first; extract one if you're about to write the same thing twice." Triggers on "add a card", "build a header", "render a status", "show a banner", "make a list view", "design the page", or any new screen/dialog/form.
---

# Reuse-first UI/UX

The biggest UI debt is drift: the same thing rendered four different ways because each was hand-written
in isolation. This skill is the brake.

Rule: **before writing any inline markup, look for an existing component. Before writing the same
markup twice, extract one.**

Paired with `frontend-architecture` — that one defines *where* things go; this defines *when to stop
and look*. Scope: `@app/ui` = `packages/ui`.

## TL;DR

1. **Scan first.** `ls packages/ui/src/components/` and the feature's `components/` before writing anything.
2. **Compose, don't copy.** If a primitive exists in `packages/ui/src/components/ui/` (shadcn) or a composite in `packages/ui/src/components/`, use it.
3. **Extract on the second occurrence.** The second callsite is the cheapest moment to find the right abstraction.
4. **One canonical implementation per concept** — a status pill, a page header, a card each have exactly one home.
5. **Pure presentation → `packages/ui`. Touches composables/router → `apps/web/src/features/<x>/components/`.**

## When it fires

About to write a new `.vue` file; add familiar-looking markup; add a status indicator/header/banner/card/dialog/list/table row; design a screen; or hear "add a / build a / render a / show a / design the …". Err toward firing.

Skip for: pure logic edits (composables/stores), editing existing templates without new surfaces, throwaway prototypes.

## The pre-write scan (every time)

```bash
ls packages/ui/src/components/ui                  # shadcn primitives
ls packages/ui/src/components                     # repo-shared composites
ls apps/web/src/features/<feature>/components      # feature-local composites
```

If something matches → use it. If it's *close* → extend it (add an optional prop) rather than fork.

## Decision tree

```
Need to render a UI surface.
├── Does a shadcn primitive cover it? (ls packages/ui/src/components/ui)
│   ├── Yes → use it. Missing → `pnpm dlx shadcn-vue@latest add <name>`.
│   └── No → ↓
├── Does a composite ship in packages/ui/src/components?
│   ├── Yes → use it.   Close → extend with an optional prop.
│   └── No → ↓
├── Will another page render the same surface?
│   ├── Yes, pure (no router/composables/@/... imports) → packages/ui/src/components/<Name>.vue
│   ├── Yes, needs composables/router → apps/web/src/features/<feature>/components/<Name>.vue
│   └── Nothing else uses it → inline in the page is fine (flag `// TODO: extract if this recurs`)
```

## Extract on the second occurrence

- **One occurrence:** inline is fine.
- **Two:** you can see the variance — extract (props for what differs, defaults for what doesn't).
- **Three+:** drift is happening — extract immediately and migrate every site in the same change.

The cost of waiting shows up later as a multi-PR audit to consolidate five hand-rolled variants.

## Reuse-friendly component conventions

Pure components in `packages/ui/src/components/`:
- One responsibility. Props in, events out — never reach into API/router/Pinia.
- Accept `class?: HTMLAttributes['class']`, merge with `cn()`.
- `data-slot="<component-name>"` on the root so specs target it without coupling to class strings.
- No `@/...` imports (only `@app/types`, `@app/ui/...`, `vue`, third-party). Need a composable? It belongs in `apps/web`.

Feature-local components (`apps/web/src/features/<x>/components/`): may use `vue-router` and the feature's composables; same prop/event/class/slot discipline; promote to `@app/ui` the moment a second feature needs it.

## Naming

The name is the API. Concrete + singular. Good: `UserStatusPill`, `ProductCard`, `PageHeader`, `EmptyState`. Bad: `StatusThing`, `HeaderOrFooter`, `Display`, `MyCard`, `GenericList` ("generic" is a smell).

## Anti-patterns (refuse to write)

- A second hand-rolled status pill / header / banner / card in any page. Use/extend the shared one.
- A `<span class="bg-amber-100 …">` rendering a status — that's a `StatusPill` component.
- Copy-pasting markup into a new page "just to get it working".
- A shadcn primitive copied into `apps/web/src/components/ui/` (CLI writes to `packages/ui`, always).

## Pre-PR checklist

- [ ] Scanned `packages/ui/src/components/` and the feature's `components/` before writing.
- [ ] Every recurring surface renders through a shared component, not inline markup.
- [ ] New component has: props for what differs, defaults for what doesn't, `class?`, `data-slot`.
- [ ] If extracted, every existing callsite migrated in the same change.
- [ ] Lives in `packages/ui` if pure, `apps/web/src/features/<x>/components/` if it touches composables/router.
- [ ] Name is concrete and singular.

## After-write

```bash
pnpm --filter web type-check
pnpm --filter web lint
```

## Related skills

`frontend-architecture`, `new-vue-page` (if present), `add-shared-type`, `commit-conventions`.
