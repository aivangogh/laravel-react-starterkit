import { Settings } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Settings feature routes. Registered as a CHILD of the authenticated `DashboardLayout` shell.
 * Gated by the `settings.view` permission — the guard redirects unauthorised users to `forbidden`
 * and the same permission hides the nav item (see `@/shared/router/types`).
 */
const routes: AppRouteRecord[] = [
  {
    path: 'settings',
    name: 'settings.index',
    component: () => import('@/features/settings/pages/SettingsPage.vue'),
    meta: {
      permission: 'settings.view',
      nav: { title: 'Settings', icon: Settings, order: 100 },
    },
  },
]

export default routes
