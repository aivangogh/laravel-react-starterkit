import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type { User } from '@app/types'
import { ensureCsrfCookie, http, isApiError } from '@/shared/lib/http'
import { authKeys } from '@/shared/lib/query-keys'

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

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
 * GET /api/user. A 401/419 means "no session" and resolves to `null` (logged out). Any other failure
 * (network down, 500) is rethrown so it surfaces as an error instead of silently logging the user out.
 */
export async function fetchUser(): Promise<User | null> {
  try {
    const { data } = await http.get<User>('/api/user')
    return data
  } catch (error) {
    const status = isApiError(error) ? error.response?.status : undefined
    if (status === 401 || status === 419) return null
    throw error
  }
}

/**
 * The session user. This is the ONE source of auth state in the SPA: the route guard reads it via
 * `queryClient.ensureQueryData(userQueryOptions)`, components via {@link useUser}. It never goes
 * stale on its own — login/logout/profile writes update it explicitly.
 */
export const userQueryOptions = queryOptions({
  queryKey: authKeys.user(),
  queryFn: fetchUser,
  staleTime: Infinity,
})

/** The current user (`null` when logged out). Already resolved by the route guard, so never suspends there. */
export function useUser(): User | null {
  return useSuspenseQuery(userQueryOptions).data
}

/** Write the freshly-fetched session user into the cache (after login/register/profile changes). */
export function useRefreshUser() {
  const queryClient = useQueryClient()
  return () => queryClient.fetchQuery({ ...userQueryOptions, staleTime: 0 })
}

export function useLogin() {
  const refreshUser = useRefreshUser()
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      await ensureCsrfCookie()
      await http.post('/login', credentials)
      return refreshUser()
    },
  })
}

export function useRegister() {
  const refreshUser = useRefreshUser()
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await ensureCsrfCookie()
      await http.post('/register', payload)
      return refreshUser()
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie()
      await http.post('/logout')
    },
    onSuccess: () => {
      // Drop every cached server response so the next user never sees the previous user's data.
      queryClient.clear()
      queryClient.setQueryData(authKeys.user(), null)
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<{ message: string }>('/forgot-password', payload)
      return data
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<{ message: string }>('/reset-password', payload)
      return data
    },
  })
}
