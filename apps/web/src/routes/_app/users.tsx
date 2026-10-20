import { createFileRoute } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { UsersPage } from '@/features/users/pages/UsersPage'

// `permission` gates both the route (via the `_app` guard) and its nav item.
export const Route = createFileRoute('/_app/users')({
  staticData: {
    permission: 'users.view',
    nav: { title: 'Users', icon: Users, order: 10 },
  },
  component: UsersPage,
})
