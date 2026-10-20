# E-commerce module (frontend stub)

This folder is the frontend half of the optional e-commerce module. `php artisan kit:install` MOVES it into the app **only** when the E-commerce preset is selected — a Basic build carries no e-commerce code and never mounts it. The move (`backend/app/Installer/ModulePublisher.php`) splits the stub in two:

| Stub path                                      | Installed to                  |
| ---------------------------------------------- | ----------------------------- |
| `routes/_app/**` (TanStack Router file routes) | `src/routes/_app/**` (merged) |
| everything else                                | `src/features/ecommerce/**`   |

**Route files** (`routes/_app/shop/index.tsx`, `shop/$id.tsx`, `cart.tsx`, `checkout/index.tsx`, `checkout/confirmation/$id.tsx`, `admin/{products,categories,orders}.tsx`) are thin: `staticData` (`module: 'ecommerce'`, plus `permission`/`nav` where the page has them) and a `component`. They import their pages from the POST-install location `@/features/ecommerce/<sub>/pages/<Page>`, so they are excluded from type-checking while they sit here (`apps/web/tsconfig.json` `exclude`); the router plugin adds them to `routeTree.gen.ts` on the next build after install. The `_app` guard enforces `module`/`permission` — never add a per-route `beforeLoad`.

**Everything else** is location-independent so it works identically here and in `src/features/ecommerce/`: package imports (`@app/types`, `@app/ui`), the `@/` alias for app-shared code only (`@/shared/...`, `@/features/auth/...`), and RELATIVE paths between sub-features (`storefront`, `cart`, `checkout`, `products`, `categories`, `orders`). `types.ts` holds the shared API contract (mirrors the backend `*Resource` classes exactly: UUID ids, `IsoDateTime` timestamps, money in integer minor units); `lib/money.ts` is the single home for money formatting/conversion; `lib/paths.ts` holds the module's route paths as plain strings (literal paths would not type-check here, where the routes are not in the route tree yet). The stub type-checks and unit-tests in place (via the `apps/web/tsconfig.json` and `vitest.config.ts` includes) but is never bundled into the SPA until installed.
