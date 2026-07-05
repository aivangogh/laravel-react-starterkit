import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { User } from '@app/types'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { authKeys } from '@/shared/lib/query-keys'
import { useAuthStore } from '@/features/auth/stores/auth'

export interface UpdateProfilePayload {
  name: string
  email: string
}

export interface UpdatePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

/**
 * Self-service profile mutations. Each write primes the CSRF cookie, then hits its Fortify-style
 * endpoint. Anything that changes the current user (name/email, avatar) refreshes the session so
 * the topbar avatar/name update immediately: it re-runs the auth store `fetchUser()` and
 * invalidates the `authKeys.user()` cache entry.
 */
export function useProfile() {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  async function refreshSession() {
    await authStore.fetchUser()
    await queryClient.invalidateQueries({ queryKey: authKeys.user() })
  }

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      await ensureCsrfCookie()
      const { data } = await http.put<User>('/api/profile', payload)
      return data
    },
    onSuccess: refreshSession,
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async (payload: UpdatePasswordPayload) => {
      await ensureCsrfCookie()
      await http.put('/api/profile/password', payload)
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      await ensureCsrfCookie()
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await http.post<User>('/api/profile/avatar', formData)
      return data
    },
    onSuccess: refreshSession,
  })

  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie()
      await http.delete('/api/profile/avatar')
    },
    onSuccess: refreshSession,
  })

  return {
    updateProfileMutation,
    updatePasswordMutation,
    uploadAvatarMutation,
    removeAvatarMutation,
  }
}
