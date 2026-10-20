import { createFileRoute } from '@tanstack/react-router'
import { ProductDetailPage } from '@/features/ecommerce/storefront/pages/ProductDetailPage'

// Product detail — reached from the shop grid, not a nav item.
export const Route = createFileRoute('/_app/shop/$id')({
  staticData: { module: 'ecommerce' },
  component: function ProductDetailRoute() {
    const { id } = Route.useParams()
    // Keyed so per-product state (chosen quantity) starts fresh on each product.
    return <ProductDetailPage key={id} id={id} />
  },
})
