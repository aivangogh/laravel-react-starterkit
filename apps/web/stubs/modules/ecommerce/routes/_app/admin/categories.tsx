import { createFileRoute } from '@tanstack/react-router'
import { Tags } from 'lucide-react'
import { CategoriesPage } from '@/features/ecommerce/categories/pages/CategoriesPage'

// `permission` gates both the route (via the `_app` guard) and its nav item.
export const Route = createFileRoute('/_app/admin/categories')({
  staticData: {
    module: 'ecommerce',
    permission: 'catalog.view',
    nav: { title: 'Categories', icon: Tags, order: 51 },
  },
  component: CategoriesPage,
})
