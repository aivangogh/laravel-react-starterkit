import { ShieldCheck } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Roles & permissions feature routes. Auto-aggregated by the router as a child of the
 * authenticated `DashboardLayout` shell (see `@/shared/router/types`). `meta.permission` gates
 * both the route and its nav item; `meta.nav` surfaces the sidebar entry.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'roles',
    name: 'roles.index',
    component: () => import('@/features/roles/pages/RolesPage.vue'),
    meta: {
      permission: 'roles.view',
      nav: { title: 'Roles', icon: ShieldCheck, order: 20 },
    },
  },
]

export default routes
