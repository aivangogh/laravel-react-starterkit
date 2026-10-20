import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GeneralSettings } from '@app/types'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { settingsKeys } from '@/shared/lib/query-keys'

/** The mutable subset of {@link GeneralSettings} the update endpoint accepts. */
export type UpdateSettingsPayload = Pick<
  GeneralSettings,
  'app_name' | 'support_email' | 'registration_enabled'
>

/** The application-wide general settings (`GET /api/settings`), cached under `settingsKeys.detail()`. */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: async () => {
      const { data } = await http.get<GeneralSettings>('/api/settings')
      return data
    },
  })
}

/**
 * Update the general settings (`PUT /api/settings`). On success we seed the cache with the fresh
 * copy and invalidate `settingsKeys.detail()` so any other reader refetches.
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateSettingsPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.put<GeneralSettings>('/api/settings', payload)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.detail(), data)
      return queryClient.invalidateQueries({ queryKey: settingsKeys.detail() })
    },
  })
}
