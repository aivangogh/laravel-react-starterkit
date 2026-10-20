import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '@/features/ecommerce/checkout/pages/CheckoutPage'

// Self-service checkout, reached from the cart — not a nav item.
export const Route = createFileRoute('/_app/checkout/')({
  staticData: { module: 'ecommerce' },
  component: CheckoutPage,
})
