import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { GeneralSettings } from '@app/types'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { settingsKeys } from '@/shared/lib/query-keys'

/** The mutable subset of {@link GeneralSettings} the update endpoint accepts. */
export type UpdateSettingsPayload = Pick<
  GeneralSettings,
  'app_name' | 'support_email' | 'registration_enabled'
>

/**
 * Server state for the application-wide general settings: a `useQuery` bound to
 * `GET /api/settings` plus the `PUT /api/settings` mutation. On a successful write we seed the
 * cache with the fresh copy and invalidate `settingsKeys.detail()` so any other reader refetches.
 */
export function useSettings() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: async () => {
      const { data } = await http.get<GeneralSettings>('/api/settings')
      return data
    },
  })

  const updateMutation = useMutation({
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

  return { settingsQuery, updateMutation }
}
