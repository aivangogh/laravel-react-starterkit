---
name: dont-repeat-yourself
description: DRY discipline across the full repo — backend, frontend, types, tests. Use before writing a constant, validation rule, mapping function, model behavior, hook, status string, route literal, or any block of logic that looks familiar. Enforces "extract on the second occurrence" and "one canonical home per fact" across `apps/web`, `packages/`, and `backend/`. Triggers: "add a constant", "validate this input", "map this status", "convert/format/parse", "should I extract this", "same thing in two places".
---

# Don't Repeat Yourself

The biggest source of latent bugs is the same fact stated in two places that drift apart: a status
string the FE spells differently than the BE; a validation rule re-implemented per controller; a magic
number meaning "default page size" in three files with three values.

Rule: **one canonical home per fact. Extract on the second occurrence. Reference, don't restate.**

Broad sibling of `ui-reuse-first` (that one is JSX markup). This covers everything else: constants,
enums, types, validation, query scopes, transforms, hooks, fixtures.

## TL;DR

1. **Search before you write.** Grep for the concept before typing it; if it exists, import it.
2. **One canonical home per fact** — a status enum, permission name, default page size, date format each lives in exactly one place.
3. **Extract on the second occurrence.** Once is data, twice is a pattern.
4. **Cross-stack facts go in `packages/types` (`@app/types`).** Anything FE and BE both reference (DTOs, enums, status strings, permission names) — never restated in either app.
5. **Backend reuse: traits, Form Requests, Eloquent scopes, API Resources, Policies, Action classes, enums/config.**
6. **Frontend reuse: hooks, utility modules, shared components, shared types.**

## The pre-write scan

```bash
rg "literal-or-name" apps packages backend                 # strings/constants, both halves
rg -i "(weightedScore|weighted_score)" apps packages backend  # rename-aware function/method
rg "required\|string\|max:255" backend/app/Http/Requests    # a validation rule
rg "where\('status'" backend/app                            # an Eloquent clause
```

If anything matches, read it before writing — import/extend it, or (if coincidental) name yours so a
future search distinguishes them.

## Decision tree

```
About to write logic / a constant / a type / a rule.
├── Crosses the FE/BE boundary?            → packages/types (@app/types). Never duplicate across apps.
├── Backend-only?
│   ├── Behavior shared by ≥2 models       → app/Models/Concerns/<Trait>.php
│   ├── Authorization repeated             → Policy method + Gate::authorize(...) / permission middleware
│   ├── Query filter repeated              → Eloquent scope on the model
│   ├── Validation rules repeated          → Form Request
│   ├── Response shape repeated            → API Resource
│   ├── Domain rule (calc, state machine)  → Action / Service class
│   ├── Test arrangement repeated          → factory state / helper / dataset
│   └── Constant / magic value             → config/<file>.php or App\Enums
└── Frontend-only?
    ├── State logic shared by ≥2 components → hook in features/<x>/hooks/ (shared/hooks/ if cross-feature)
    ├── HTTP call shared by ≥2 callers      → TanStack Query hook (never inline axios)
    ├── Pure transform (format/parse/map)   → utility in features/<x>/lib/ (or shared if cross-feature)
    ├── Recurring JSX markup                → see ui-reuse-first
    └── Constant / magic value              → typed const in a shared module, never inline
```

## Canonical homes

- **Cross-stack facts → `@app/types`.** DTOs, status/role/permission enums, API path constants. The
  Laravel seeder and the FE both read the same permission names — define them once. Use `add-shared-type`.
- **Backend → `backend/app/`.** Copying a method between models → a trait. A `where()->orderBy()` chain
  in 2 places → a scope. Same rules in 2 controllers → a Form Request. Same JSON in 2 endpoints → a
  Resource. Same authorization in 2 controllers → a Policy + permission middleware. Same magic value →
  `config/*` or an enum case.
- **Frontend → `apps/web/src/`.** Repeated stateful logic → a hook. Repeated fetcher → a
  TanStack Query hook (never raw axios). Repeated transform → a `lib/` utility. Route gating and nav
  live once in each route's `staticData` (read by the `_app` guard and `useNavItems`) — never restated.
- **Project-wide config → `packages/config` (`@app/config`).** ESLint/Prettier/tsconfig bases — extend,
  don't per-app override without checking the base first.

## Constants and magic values

A bare literal is fine **once**. The moment it appears in a second file, name it.

| Bad | Good |
|---|---|
| `if (status === 'active')` in three components | a `Status` enum from `@app/types` |
| `?per_page=25` in two fetchers | `DEFAULT_PAGE_SIZE` const in a shared module |
| `'users.view'` typed inline in route guard + policy | a `Permission` enum mirrored to `@app/types` |
| `max:255` in five Form Requests | a named rule / base-request constant |

The line: **if changing the value requires editing it in multiple places, it's already wrong.** Extract.

## What is NOT a DRY violation (resist over-abstraction)

- Two things that *look* alike but mean different things — forcing them together is worse.
- An abstraction needing ≥3 boolean flags to cover both callers — that's two functions in a trench coat.
- Test arrange/act/assert blocks where explicitness aids readability.
- Inventing a `SharedUtils` layer to host one function.

Test: can you describe the extracted unit in one sentence without "or"? If no, you're merging two concepts. Don't.

## Pre-PR checklist

- [ ] No status/permission/role literal appears more than once; all sites import an enum.
- [ ] No validation-rule array duplicated across Form Requests.
- [ ] No Eloquent query body duplicated; shared filters are scopes.
- [ ] No utility/hook has a near-twin; HTTP goes through Query hooks only.
- [ ] No magic number/default lives in more than one file.
- [ ] If I extracted a unit, I migrated every site in the same change.

## Related skills

`ui-reuse-first`, `add-shared-type`, `frontend-architecture`, `new-api-endpoint`.
