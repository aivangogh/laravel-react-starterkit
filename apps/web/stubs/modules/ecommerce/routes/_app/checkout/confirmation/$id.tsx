import { createFileRoute } from '@tanstack/react-router'
import { OrderConfirmationPage } from '@/features/ecommerce/checkout/pages/OrderConfirmationPage'

// Reached after a successful order placement — not a nav item.
export const Route = createFileRoute('/_app/checkout/confirmation/$id')({
  staticData: { module: 'ecommerce' },
  component: function OrderConfirmationRoute() {
    const { id } = Route.useParams()
    return <OrderConfirmationPage id={id} />
  },
})
