import { Package } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Products (catalog) routes. Registered as a CHILD of the authenticated `DashboardLayout` shell
 * (see `@/shared/router/types`), so the path is relative. `meta.permission` gates both the route
 * and its nav item; `meta.nav` surfaces it in the sidebar. Aggregated by the module's `routes.ts`
 * `./*&#47;routes.ts` glob — do not import this file directly.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'admin/products',
    name: 'ecommerce.products.index',
    component: () => import('./pages/ProductsPage.vue'),
    meta: {
      permission: 'catalog.view',
      nav: { title: 'Products', icon: Package, order: 50 },
    },
  },
]

export default routes
