import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import type { Activity } from '@app/types'
import { http } from '@/shared/lib/http'
import { activityKeys } from '@/shared/lib/query-keys'
import { useServerTable } from '@/shared/composables/useServerTable'

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
 * Single activity-log entry, fetched on demand for the detail dialog. Pass a reactive id (or a
 * getter that yields `null` while the dialog is closed) — the query stays disabled until an id
 * is present, so opening the dialog is what triggers the fetch.
 */
export function useActivityDetail(id: MaybeRefOrGetter<number | null | undefined>) {
  const activityId = computed(() => toValue(id) ?? null)

  return useQuery({
    queryKey: computed(() => activityKeys.detail(activityId.value ?? 0)),
    queryFn: async () => {
      const { data } = await http.get<Activity>(`${ACTIVITY_ENDPOINT}/${activityId.value}`)
      return data
    },
    enabled: computed(() => activityId.value !== null),
  })
}
