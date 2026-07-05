import { KeyRound } from 'lucide-vue-next'
import type { AppRouteRecord } from '@/shared/router/types'

/**
 * API Tokens feature routes. Registered as a CHILD of the authenticated `DashboardLayout` shell.
 * Self-service — no `permission` gate, so every authenticated user manages their own tokens and
 * the nav item is always visible.
 */
const routes: AppRouteRecord[] = [
  {
    path: 'tokens',
    name: 'tokens.index',
    component: () => import('@/features/tokens/pages/TokensPage.vue'),
    meta: {
      nav: { title: 'API Tokens', icon: KeyRound, order: 110 },
    },
  },
]

export default routes
