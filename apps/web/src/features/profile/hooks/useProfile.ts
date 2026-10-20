import { useMutation } from '@tanstack/react-query'
import type { User } from '@app/types'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { useRefreshUser } from '@/features/auth/hooks/useAuth'

/**
 * Self-service profile mutations. Each write primes the CSRF cookie, then hits its Fortify-style
 * endpoint. Anything that changes the current user (name/email, avatar) refreshes the session user
 * query so the topbar avatar/name update immediately.
 */
export interface UpdateProfilePayload {
  name: string
  email: string
}

export interface UpdatePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

/** Update name/email (`PUT /api/profile` → User). Refreshes the session user on success. */
export function useUpdateProfile() {
  const refreshUser = useRefreshUser()
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      await ensureCsrfCookie()
      const { data } = await http.put<User>('/api/profile', payload)
      return data
    },
    onSuccess: refreshUser,
  })
}

/** Change the password (`PUT /api/profile/password`). Leaves the session user untouched. */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (payload: UpdatePasswordPayload) => {
      await ensureCsrfCookie()
      await http.put('/api/profile/password', payload)
    },
  })
}

/** Upload a new avatar (multipart `POST /api/profile/avatar` → User). Refreshes the session user. */
export function useUploadAvatar() {
  const refreshUser = useRefreshUser()
  return useMutation({
    mutationFn: async (file: File) => {
      await ensureCsrfCookie()
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await http.post<User>('/api/profile/avatar', formData)
      return data
    },
    onSuccess: refreshUser,
  })
}

/** Remove the avatar (`DELETE /api/profile/avatar`). Refreshes the session user. */
export function useRemoveAvatar() {
  const refreshUser = useRefreshUser()
  return useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie()
      await http.delete('/api/profile/avatar')
    },
    onSuccess: refreshUser,
  })
}
