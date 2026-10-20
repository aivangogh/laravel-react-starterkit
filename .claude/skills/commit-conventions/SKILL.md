---
name: commit-conventions
description: Git commit message + PR title/body + branch naming conventions for this repo. Use when about to write a commit message, draft a PR title or body, rename a branch, or when the user asks "what should the commit say", "write the commit message", "open a PR", "fix this commit", or to review a commit/PR for style. Enforces Conventional Commits with this repo's scopes and the project's Co-Authored-By footer.
---

# commit-conventions

Consistent messages make `git log` searchable, blame readable, reviews fast.

## TL;DR

```
<type>(<scope>): <imperative summary, lowercase, no period, ≤70 chars>

<optional body — wrap at 72 cols, "why" not "what">

<optional footer — BREAKING CHANGE, Refs/Closes, Co-Authored-By>
```

- **Type required**, scope optional but encouraged.
- **Imperative mood** ("add", not "added"/"adds"). **No trailing period.** Lowercase summary (proper nouns keep case: `Sanctum`, `Postgres`).
- Body explains **why and what tradeoff**, not what the diff shows.
- **One logical change per commit.** Writing "and" twice in a title → split.

## Types

`feat` (user-visible behavior) · `fix` (corrects broken behavior) · `refactor` (no behavior change) ·
`perf` (measurably faster) · `docs` (README/comments/skills) · `test` (tests only) · `chore` (repo
hygiene, scaffolding, lockfiles) · `ci` (workflows) · `build` (build tooling, composer/pnpm scripts) ·
`style` (whitespace only — rare) · `revert`.

If a change spans two types, split it.

## Scopes (this monorepo)

| Scope | Covers |
|---|---|
| `web` | `apps/web/` — React SPA |
| `backend` | `backend/` — Laravel app code |
| `ui` | `packages/ui/` (`@app/ui`) — shadcn/ui (Base UI) components, tokens |
| `types` | `packages/types/` (`@app/types`) — shared TS types |
| `config` | `packages/config/` (`@app/config`) — eslint/prettier/tsconfig bases |
| `auth` | SPA↔Sanctum/Fortify flow (cookies, CSRF, guards) |
| `db` | migrations, schema, seeders, postgres init |
| `cache` | Redis usage, invalidation, observers |
| `queue` | jobs, queue worker |
| `docker` | `docker-compose.yml`, `docker/` |
| `installer` | `kit:install`, presets, scaffolder |
| `ci` | `.github/workflows/*` |
| `deps` | dependency bumps |

One scope only. A change touching `web` + `backend` → split, or pick the dominant scope and mention
the other in the body.

## Title rules

- ≤70 chars total (including `type(scope): `). Imperative, lowercase summary, no period, no issue
  numbers (those go in footer/body).

Good:
```
feat(auth): add Sanctum SPA cookie flow with headless Fortify
fix(backend): use activitylog v5 dontLogEmptyChanges on User
chore(docker): map postgres/redis to 5434/6381 to avoid conflicts
docs(skills): add php-84-runtime and sanctum-fortify-auth
```
Bad: `Updated some files` (vague, past tense) · `fix: bug` (what/where?) · `feat(web,backend): wire dashboard` (multi-scope — split).

## Body

Wrap at 72 cols, blank line after title, answer **why/tradeoff**. Reference prior bugs, decisions,
gotchas a future reader can't reconstruct from the diff.

## Footers

```
BREAKING CHANGE: <what callers must change>
Refs: #<n>        (relates to)
Closes: #<n>      (auto-closes on merge to default branch)
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

- Claude-authored work ends with the **Co-Authored-By** line above (project standing convention).
- Closing **multiple** issues needs the keyword repeated per number: `Closes #97, closes #98` — a bare
  comma list (`Closes #97, #98`) closes only the first. Verify with
  `gh pr view <N> --json closingIssuesReferences`.

## Atomicity

Before committing: *"if reverted, would this leave the repo sensible?"* If revert also rolls back
something unrelated, the commit's too big. Common splits: refactor before feat; test with the fix it
covers; schema migration before code using it; deps bump separate from the feature.

## Branch naming

```
<type>/<short-kebab-summary>      e.g. feat/api-users-crud, fix/auth-cookie-domain
```
Lowercase, hyphens, ~50 chars, no personal prefixes. Delete after merge.

## PR titles / bodies

PR title = the squash-merge commit title → same rules. Body: a short **Summary** (what + why),
**Changes** (user-visible bullets), **Test plan** (concrete steps), **Risk** (what could break +
rollback — never "None" for auth/schema/env changes). (A `.github/pull_request_template.md` is not set
up yet; until it is, include those four sections by hand.)

## Anti-patterns to refuse

- `misc`/`update`/`cleanup`/`wip` titles · no type prefix · past/present tense (use imperative) ·
  issue numbers in titles · emojis · skipping `Co-Authored-By` when Claude co-authored ·
  `--no-verify` / hook bypass · `git push --force` to `main` · bare-comma `Closes` lists.

## Quick checklist before `git commit`

- [ ] Title fits `type(scope): imperative ≤70` — no period.
- [ ] Body (if present) wraps at 72 and explains *why*.
- [ ] One logical change.
- [ ] `Co-Authored-By` footer present (Claude-authored).
- [ ] `BREAKING CHANGE:` footer if breaking.

## Related skills

`ci-readiness` (run before pushing) · `lint-and-format` (auto-fix style first).
