import { useQuery } from '@tanstack/react-query'
import type { Activity } from '@app/types'
import { http } from '@/shared/lib/http'
import { activityKeys } from '@/shared/lib/query-keys'
import { useServerTable } from '@/shared/hooks/useServerTable'

/** Read-only activity-log endpoint (root API host does NOT include `/api`; see `http`). */
const ACTIVITY_ENDPOINT = '/api/activity-log'

/**
 * Server-driven activity-log list. Delegates the page/per_page/sort/dir/q contract to
 * `useServerTable`, so the DataTable stays purely presentational.
 */
export function useActivityTable() {
  return useServerTable<Activity>({
    resource: activityKeys.all[0],
    endpoint: ACTIVITY_ENDPOINT,
  })
}

/**
 * Single activity-log entry, fetched on demand for the detail dialog. The query stays disabled
 * while `id` is `null`/`undefined`, so opening the dialog is what triggers the fetch.
 */
export function useActivityDetail(id: number | null | undefined) {
  const activityId = id ?? null

  return useQuery({
    queryKey: activityKeys.detail(activityId ?? 0),
    queryFn: async () => {
      const { data } = await http.get<Activity>(`${ACTIVITY_ENDPOINT}/${activityId}`)
      return data
    },
    enabled: activityId !== null,
  })
}
