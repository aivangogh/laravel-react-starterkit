import { UserCircle } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * Profile feature routes. Registered as a CHILD of the authenticated `DashboardLayout` shell.
 * Self-service, so there is NO `permission` gate — every authenticated user can edit their own
 * profile. `requiresAuth` is inherited from the shell.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'profile',
    name: 'profile.edit',
    component: () => import('@/features/profile/pages/ProfilePage.vue'),
    meta: {
      nav: { title: 'Profile', icon: UserCircle, order: 90 },
    },
  },
]

export default routes
