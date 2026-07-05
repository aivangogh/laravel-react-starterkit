import { Users } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Users feature routes. Registered as a CHILD of the authenticated `DashboardLayout` shell (see
 * `@/shared/router/types`), so the path is relative. `meta.permission` gates both the route and its
 * nav item; `meta.nav` surfaces it in the sidebar.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'users',
    name: 'users.index',
    component: () => import('@/features/users/pages/UsersPage.vue'),
    meta: {
      permission: 'users.view',
      nav: { title: 'Users', icon: Users, order: 10 },
    },
  },
]

export default routes
