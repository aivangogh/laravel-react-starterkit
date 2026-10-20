import { createFileRoute } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { RolesPage } from '@/features/roles/pages/RolesPage'

// `permission` gates both the route (via the `_app` guard) and its nav item.
export const Route = createFileRoute('/_app/roles')({
  staticData: {
    permission: 'roles.view',
    nav: { title: 'Roles', icon: ShieldCheck, order: 20 },
  },
  component: RolesPage,
})
