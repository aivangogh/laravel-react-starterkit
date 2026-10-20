import { createFileRoute } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { CartPage } from '@/features/ecommerce/cart/pages/CartPage'

// Self-service: any signed-in user has a cart, so no permission gate. Listed right after the shop.
export const Route = createFileRoute('/_app/cart')({
  staticData: {
    module: 'ecommerce',
    nav: { title: 'Cart', icon: ShoppingCart, order: 31 },
  },
  component: CartPage,
})
