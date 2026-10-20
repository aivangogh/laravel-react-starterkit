import { createFileRoute } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'

// `permission` gates both the route (via the `_app` guard) and its nav item.
export const Route = createFileRoute('/_app/settings')({
  staticData: {
    permission: 'settings.view',
    nav: { title: 'Settings', icon: Settings, order: 100 },
  },
  component: SettingsPage,
})
