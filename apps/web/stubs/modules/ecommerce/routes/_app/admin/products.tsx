import { createFileRoute } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { ProductsPage } from '@/features/ecommerce/products/pages/ProductsPage'

// `permission` gates both the route (via the `_app` guard) and its nav item.
export const Route = createFileRoute('/_app/admin/products')({
  staticData: {
    module: 'ecommerce',
    permission: 'catalog.view',
    nav: { title: 'Products', icon: Package, order: 50 },
  },
  component: ProductsPage,
})
