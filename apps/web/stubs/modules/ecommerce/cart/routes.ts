import { ShoppingCart } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Cart route. Aggregated by the module's `routes.ts` sub-glob and mounted as a child of the
 * authenticated `DashboardLayout`. Self-service: any signed-in user has a cart, so no permission
 * gate. Surfaced in the sidebar right after the shop.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'cart',
    name: 'ecommerce.cart',
    component: () => import('./pages/CartPage.vue'),
    meta: { nav: { title: 'Cart', icon: ShoppingCart, order: 31 } },
  },
]

export default routes
