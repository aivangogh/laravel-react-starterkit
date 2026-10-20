import { createFileRoute } from '@tanstack/react-router'
import { ScrollText } from 'lucide-react'
import { ActivityPage } from '@/features/activity/pages/ActivityPage'

// `permission` gates both the route (via the `_app` guard) and its nav item.
export const Route = createFileRoute('/_app/activity')({
  staticData: {
    permission: 'activity.view',
    nav: { title: 'Activity', icon: ScrollText, order: 40 },
  },
  component: ActivityPage,
})
