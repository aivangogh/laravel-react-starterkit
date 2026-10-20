import type { ComponentType, SVGProps } from 'react'

/**
 * Route metadata contract.
 *
 * Every page is a file route under `src/routes/`. Authenticated pages live under `src/routes/_app/`
 * (the `DashboardLayout` shell), public auth pages under `src/routes/_guest/`. A route declares its
 * intent through `staticData` — never through its own `beforeLoad`: the single guard in
 * `routes/_app.tsx` reads `permission`/`module` from every matched route, and the sidebar is derived
 * from routes that set `nav` (see `useNavItems`).
 */

/** Sidebar/nav presentation for a route. Presence of `staticData.nav` is what makes a route nav-able. */
export interface AppNavMeta {
  /** Label rendered next to the icon. */
  title: string
  /** Icon component — import the lucide-react icon directly in the route file. */
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  /** Ascending sort weight among nav items (default 0). */
  order?: number
}

/** Typed `staticData` for every app route (merged into TanStack Router below). */
export interface AppRouteStaticData {
  /** Permission the user must hold; missing it redirects to `/forbidden`. Gates the nav item too. */
  permission?: string
  /**
   * The optional install module this route belongs to (e.g. `'ecommerce'`). When set, the route + its
   * nav item are additionally gated by the runtime install flag from `/api/config`: hidden in the nav
   * and redirected home by the guard unless the module is enabled. The PRIMARY gate is still
   * file-presence — a module's route files only exist in `src/routes/` once `kit:install` publishes
   * them — so this flag is a second layer for a mounted-but-disabled module.
   */
  module?: string
  /** Set to surface this route in the app sidebar/nav. */
  nav?: AppNavMeta
}

declare module '@tanstack/react-router' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface StaticDataRouteOption extends AppRouteStaticData {}
}

/** A permission-resolved nav entry consumed by the nav components. */
export interface NavItem {
  /** Full path to link to (`<Link to={item.to}>`). */
  to: string
  title: string
  icon?: AppNavMeta['icon']
  order: number
  /** Permission gating visibility; `undefined` means always visible. */
  permission?: string
  /** Install module gating visibility; `undefined` means not module-gated (always visible). */
  module?: string
}
