import { Store } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Storefront (catalog) routes. Aggregated by the module's `routes.ts` sub-glob and mounted
 * as children of the authenticated `DashboardLayout` once `kit:install` copies the module to
 * `src/features/ecommerce/`. Self-service surfaces: any signed-in user can shop, so no
 * permission gate. The shop lists appear in the sidebar; the product detail does not.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'shop',
    name: 'ecommerce.shop',
    component: () => import('./pages/ShopPage.vue'),
    meta: { nav: { title: 'Shop', icon: Store, order: 30 } },
  },
  {
    path: 'shop/:id',
    name: 'ecommerce.shop.product',
    component: () => import('./pages/ProductDetailPage.vue'),
  },
]

export default routes
