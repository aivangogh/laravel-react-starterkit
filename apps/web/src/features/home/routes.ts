import { Home } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Home feature routes. Registered as a CHILD of the authenticated `DashboardLayout` shell, so
 * `path: ''` makes it the index route at `/`. This module is the reference implementation of the
 * route-module aggregation contract (see `@/shared/router/types`).
 */
const routes: AppRouteRecord[] = [
  {
    path: '',
    name: 'home',
    component: () => import('@/features/home/pages/HomePage.vue'),
    // No `permission` → the nav item is always visible. `requiresAuth` is inherited from the shell.
    meta: {
      nav: { title: 'Home', icon: Home, order: 0 },
    },
  },
]

export default routes
