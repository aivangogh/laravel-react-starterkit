import {
  createRouter,
  createWebHistory,
  type NavigationGuardReturn,
  type RouteLocationNormalized,
  type RouteRecordRaw,
} from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import { usePermissions } from '@/shared/composables/usePermissions'
import DashboardLayout from '@/shared/layouts/DashboardLayout.vue'
import type { AppRouteMeta, AppRouteRecord, NavItem } from '@/shared/router/types'

// Give vue-router's `RouteMeta` our typed shape so `to.meta.*` is checked in the guard below and
// everywhere else. `AppRouteMeta` is the single source of truth for route metadata.
declare module 'vue-router' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouteMeta extends AppRouteMeta {}
}

/**
 * Route-module aggregation — each feature exports a `default: AppRouteRecord[]` from
 * `features/<feature>/routes.ts`. Collect them eagerly and flatten into one child list.
 */
const featureModules = import.meta.glob('@/features/*/routes.ts', { eager: true }) as Record<
  string,
  { default: AppRouteRecord[] }
>

const featureRoutes: AppRouteRecord[] = Object.values(featureModules).flatMap(
  (module) => module.default ?? [],
)

/** Nav-able routes (those declaring `meta.nav`), projected to {@link NavItem} and sorted by order. */
export const navItems: NavItem[] = featureRoutes
  .filter((route): route is AppRouteRecord & { name: string } => typeof route.name === 'string')
  .filter((route) => route.meta?.nav != null)
  .map((route) => ({
    name: route.name,
    title: route.meta!.nav!.title,
    icon: route.meta!.nav!.icon,
    order: route.meta!.nav!.order ?? 0,
    permission: route.meta!.permission,
  }))
  .sort((a, b) => a.order - b.order)

const routes: RouteRecordRaw[] = [
  {
    // Authenticated app shell — every feature route renders inside DashboardLayout.
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      ...featureRoutes,
      {
        path: 'forbidden',
        name: 'forbidden',
        component: () => import('@/shared/pages/ForbiddenPage.vue'),
      },
    ],
  },
  // Public auth routes (each page wraps itself in AuthLayout).
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/pages/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/features/auth/pages/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/features/auth/pages/ForgotPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/features/auth/pages/ResetPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: { name: 'home' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * The single global navigation guard — auth + permission gating for the whole app.
 * Don't add per-route `beforeEnter` guards; express intent via route `meta` instead.
 *
 * Exported so it can be unit-tested in isolation.
 */
export async function authGuard(to: RouteLocationNormalized): Promise<NavigationGuardReturn> {
  const auth = useAuthStore()

  // Guarantee the session is resolved before the first guarded navigation (covers deep links).
  if (!auth.ready) {
    await auth.fetchUser()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (to.meta.permission) {
    const { can } = usePermissions()
    if (!can(to.meta.permission)) {
      return { name: 'forbidden' }
    }
  }

  return true
}

router.beforeEach(authGuard)
