import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

/**
 * Route-module aggregation contract.
 *
 * Every feature declares its routes in `apps/web/src/features/<feature>/routes.ts` as a
 * `default` export of type `AppRouteRecord[]`. The router (`app/router/index.ts`) collects them
 * with `import.meta.glob('@/features/*&#47;routes.ts', { eager: true })`, flattens each module's
 * `default`, and registers them as CHILDREN of the authenticated `DashboardLayout` shell.
 *
 * Nav entries are derived from routes whose `meta.nav` is set (see {@link AppNavMeta}); the
 * per-item `meta.permission` decides visibility via {@link usePermissions}.
 */

/** Sidebar/nav presentation for a route. Presence of `meta.nav` is what makes a route nav-able. */
export interface AppNavMeta {
  /** Label rendered next to the icon. */
  title: string
  /** Icon component — import the lucide-vue-next icon directly in the feature's `routes.ts`. */
  icon?: Component
  /** Ascending sort weight among nav items (default 0). */
  order?: number
}

/** Typed `meta` for every app route. Merged into vue-router's `RouteMeta` (see below). */
export interface AppRouteMeta {
  /** Route requires an authenticated user; unauthenticated visitors are sent to `login`. */
  requiresAuth?: boolean
  /** Route is for unauthenticated visitors only (login/register); authed users go `home`. */
  guestOnly?: boolean
  /** Permission the user must hold; missing it redirects to `forbidden`. Gates the nav item too. */
  permission?: string
  /** Set to surface this route in the app sidebar/nav. */
  nav?: AppNavMeta
}

/** A `RouteRecordRaw` whose `meta` is the typed {@link AppRouteMeta}. Feature `routes.ts` files use this. */
export type AppRouteRecord = RouteRecordRaw & { meta?: AppRouteMeta }

/** A permission-resolved nav entry consumed by the nav components. */
export interface NavItem {
  /** Named route to link to (`<router-link :to="{ name }">`). */
  name: string
  title: string
  icon?: Component
  order: number
  /** Permission gating visibility; `undefined` means always visible. */
  permission?: string
}
