import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Checkout routes. Aggregated by the module's `routes.ts` sub-glob and mounted as children of
 * the authenticated `DashboardLayout`. Self-service checkout — neither route is a nav item:
 * checkout is reached from the cart, and the confirmation from a successful order placement.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'checkout',
    name: 'ecommerce.checkout',
    component: () => import('./pages/CheckoutPage.vue'),
    meta: { module: 'ecommerce' },
  },
  {
    path: 'checkout/confirmation/:id',
    name: 'ecommerce.checkout.confirmation',
    component: () => import('./pages/OrderConfirmationPage.vue'),
    meta: { module: 'ecommerce' },
  },
]

export default routes
