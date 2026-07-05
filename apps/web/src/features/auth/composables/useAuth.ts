import { storeToRefs } from 'pinia'
import { useMutation } from '@tanstack/vue-query'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import {
  useAuthStore,
  type LoginCredentials,
  type RegisterPayload,
} from '@/features/auth/stores/auth'

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

/**
 * Auth facade for components: reactive session state from the Pinia store plus TanStack Query
 * mutations for the write flows. The store owns the CSRF → action → `fetchUser` orchestration;
 * the mutations expose `isPending` / `error` (422 bodies) for the forms to render.
 */
export function useAuth() {
  const store = useAuthStore()
  const { user, ready, isAuthenticated } = storeToRefs(store)

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => store.login(credentials),
  })

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => store.register(payload),
  })

  const logoutMutation = useMutation({
    mutationFn: () => store.logout(),
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<{ message: string }>('/forgot-password', payload)
      return data
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<{ message: string }>('/reset-password', payload)
      return data
    },
  })

  return {
    // reactive session state
    user,
    ready,
    isAuthenticated,
    // direct actions (also usable outside a component, e.g. the router guard)
    fetchUser: store.fetchUser,
    // write mutations
    loginMutation,
    registerMutation,
    logoutMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
  }
}
