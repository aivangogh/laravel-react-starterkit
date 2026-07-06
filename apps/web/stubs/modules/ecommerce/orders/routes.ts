import { Receipt } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Orders sub-feature routes for the e-commerce module. Aggregated by the module's `routes.ts`
 * sub-glob (`./*&#47;routes.ts`) and, once `kit:install` copies this stub to
 * `src/features/ecommerce/`, registered as a CHILD of the authenticated `DashboardLayout` shell —
 * so the path is relative. `meta.permission` gates both the route and its nav item.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'admin/orders',
    name: 'ecommerce.orders.index',
    component: () => import('./pages/OrdersPage.vue'),
    meta: {
      module: 'ecommerce',
      permission: 'orders.view',
      nav: { title: 'Orders', icon: Receipt, order: 52 },
    },
  },
]

export default routes
