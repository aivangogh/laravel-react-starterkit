import { createFileRoute } from '@tanstack/react-router'
import { UserCircle } from 'lucide-react'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'

// Self-service, so there is NO `permission` gate — every authenticated user can edit their own profile.
export const Route = createFileRoute('/_app/profile')({
  staticData: {
    nav: { title: 'Profile', icon: UserCircle, order: 90 },
  },
  component: ProfilePage,
})
