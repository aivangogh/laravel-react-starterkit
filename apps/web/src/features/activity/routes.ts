import { ScrollText } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Activity-log feature routes. Registered as a CHILD of the authenticated `DashboardLayout`
 * shell (see `@/shared/router/types`). Gated by the `activity.view` permission, which also
 * decides whether the nav item is shown.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'activity',
    name: 'activity.index',
    component: () => import('@/features/activity/pages/ActivityPage.vue'),
    meta: {
      permission: 'activity.view',
      nav: { title: 'Activity', icon: ScrollText, order: 40 },
    },
  },
]

export default routes
