import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiToken, NewApiToken } from '@app/types'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { tableKeys } from '@/shared/lib/query-keys'
import { useServerTable } from '@/shared/hooks/useServerTable'

/** Payload for `POST /api/tokens`. `abilities` omitted → the backend grants full access (`*`). */
export interface CreateTokenPayload {
  name: string
  abilities?: string[]
}

/**
 * Server state for the current user's personal access tokens: the server-driven list table
 * (via {@link useServerTable}) plus the create/revoke mutations. Both writes invalidate the
 * `tokens` table cache so the list reflects the change.
 *
 * The one-time `plain_text_token` is returned by `createMutation` and must be surfaced to the user
 * immediately — it is never recoverable afterwards.
 */
export function useTokens() {
  const queryClient = useQueryClient()

  const table = useServerTable<ApiToken>({ resource: 'tokens', endpoint: '/api/tokens' })

  // Prefix-matches every paged/sorted/searched `tokens` list entry (empty params object is a
  // partial match for any params), so a single call refreshes whatever page is on screen.
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: tableKeys.list('tokens') })

  const createMutation = useMutation({
    mutationFn: async (payload: CreateTokenPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<NewApiToken>('/api/tokens', payload)
      return data
    },
    onSuccess: () => invalidateList(),
  })

  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      await ensureCsrfCookie()
      await http.delete(`/api/tokens/${id}`)
    },
    onSuccess: () => invalidateList(),
  })

  return { ...table, createMutation, revokeMutation }
}
