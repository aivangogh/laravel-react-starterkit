import { createFileRoute } from '@tanstack/react-router'
import { Receipt } from 'lucide-react'
import { OrdersPage } from '@/features/ecommerce/orders/pages/OrdersPage'

// `permission` gates both the route (via the `_app` guard) and its nav item.
export const Route = createFileRoute('/_app/admin/orders')({
  staticData: {
    module: 'ecommerce',
    permission: 'orders.view',
    nav: { title: 'Orders', icon: Receipt, order: 52 },
  },
  component: OrdersPage,
})
