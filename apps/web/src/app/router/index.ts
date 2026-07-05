import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import { usePermissions } from '@/shared/composables/usePermissions'

declare module 'vue-router' {
  interface RouteMeta {
    /** Route requires an authenticated user; unauthenticated visitors are sent to `login`. */
    requiresAuth?: boolean
    /** Route is for unauthenticated visitors only (login/register); authed users go `home`. */
    guestOnly?: boolean
    /** Permission name the user must hold; missing it redirects home. */
    permission?: string
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/features/home/pages/HomePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/pages/LoginPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/features/auth/pages/RegisterPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/features/auth/pages/ForgotPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/features/auth/pages/ResetPasswordPage.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: { name: 'home' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * The single global navigation guard — auth + permission gating for the whole app.
 * Don't add per-route `beforeEnter` guards; express intent via route `meta` instead.
 */
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Guarantee the session is resolved before the first guarded navigation (covers deep links).
  if (!auth.ready) {
    await auth.fetchUser()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (to.meta.permission) {
    const { can } = usePermissions()
    if (!can(to.meta.permission)) {
      return { name: 'home' }
    }
  }

  return true
})
