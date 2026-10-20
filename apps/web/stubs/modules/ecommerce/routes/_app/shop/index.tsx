import { createFileRoute } from '@tanstack/react-router'
import { Store } from 'lucide-react'
import { ShopPage } from '@/features/ecommerce/storefront/pages/ShopPage'

// Self-service: any signed-in user can shop, so no permission gate.
export const Route = createFileRoute('/_app/shop/')({
  staticData: {
    module: 'ecommerce',
    nav: { title: 'Shop', icon: Store, order: 30 },
  },
  component: ShopPage,
})
