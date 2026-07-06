import { Tags } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Categories (catalog) routes. Registered as a CHILD of the authenticated `DashboardLayout` shell
 * (see `@/shared/router/types`), so the path is relative. `meta.permission` gates both the route
 * and its nav item; `meta.nav` surfaces it in the sidebar. Aggregated by the module's `routes.ts`
 * `./*&#47;routes.ts` glob — do not import this file directly.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'admin/categories',
    name: 'ecommerce.categories.index',
    component: () => import('./pages/CategoriesPage.vue'),
    meta: {
      module: 'ecommerce',
      permission: 'catalog.view',
      nav: { title: 'Categories', icon: Tags, order: 51 },
    },
  },
]

export default routes
