import type { AppRouteRecord } from '@/shared/router/types'

/**
 * E-commerce module route aggregation.
 *
 * Sub-features (catalog, cart, orders, …) each declare their routes in
 * `./<sub>/routes.ts` as a `default` export of `AppRouteRecord[]`. This file
 * collects them eagerly and flattens them into one list, which the app router
 * picks up once this module is copied to `src/features/ecommerce/` by
 * `kit:install` (the app globs `@/features/*&#47;routes.ts` — a Basic build never
 * mounts this stub). Empty until a sub-feature adds its `routes.ts`.
 */
const routes: AppRouteRecord[] = Object.values(
  import.meta.glob('./*/routes.ts', { eager: true }),
).flatMap((m) => (m as { default: AppRouteRecord[] }).default)

export default routes
