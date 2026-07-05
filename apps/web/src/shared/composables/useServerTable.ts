import type { MaybeRefOrGetter } from 'vue'
import { computed, ref, toValue, watch } from 'vue'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { Paginated } from '@app/types'
import type {
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@app/ui/components/data-table'
import { http } from '@/shared/lib/http'
import { tableKeys } from '@/shared/lib/query-keys'

export interface UseServerTableOptions {
  /** Query-key namespace for this resource, e.g. `'users'`. */
  resource: string
  /** List endpoint path passed to `http.get`, e.g. `'/api/users'`. */
  endpoint: string
  /** Initial rows-per-page (defaults to 10). */
  initialPageSize?: number
  /** Extra static/reactive query params merged into every request (e.g. a fixed filter). */
  params?: MaybeRefOrGetter<Record<string, unknown>>
  /** Gate the query (defaults to enabled). */
  enabled?: MaybeRefOrGetter<boolean>
}

/**
 * App-side glue for the `@app/ui` `DataTable`. It owns the table state refs, runs a TanStack
 * `useQuery` keyed on that state, and maps rows/`meta.total` back out — the DataTable stays
 * presentational and does no fetching.
 *
 * This is THE single place that standardises the list-endpoint contract. Every server-driven
 * list table sends the same query params, so every Phase 2 index endpoint reads the same way:
 *
 *   - `page`     1-based page number   (= `pageIndex + 1`)
 *   - `per_page` rows per page         (= `pageSize`)
 *   - `sort`     column id to sort by  (first active sort; omitted when unsorted)
 *   - `dir`      `'asc' | 'desc'`      (omitted when unsorted)
 *   - `q`        global search term    (omitted when empty)
 *
 * Change the contract here and every table follows.
 */
export function useServerTable<TRow>(options: UseServerTableOptions) {
  const pagination = ref<PaginationState>({
    pageIndex: 0,
    pageSize: options.initialPageSize ?? 10,
  })
  const sorting = ref<SortingState>([])
  const globalFilter = ref('')
  const columnVisibility = ref<VisibilityState>({})
  const rowSelection = ref<RowSelectionState>({})

  // A new search term always returns to the first page.
  watch(globalFilter, () => {
    pagination.value.pageIndex = 0
  })

  // The single source of the list-endpoint query params (see the doc block above).
  const queryParams = computed<Record<string, unknown>>(() => {
    const sort = sorting.value[0]
    return {
      page: pagination.value.pageIndex + 1,
      per_page: pagination.value.pageSize,
      ...(sort ? { sort: sort.id, dir: sort.desc ? 'desc' : 'asc' } : {}),
      ...(globalFilter.value ? { q: globalFilter.value } : {}),
      ...toValue(options.params),
    }
  })

  const queryKey = computed(() => tableKeys.list(options.resource, queryParams.value))

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await http.get<Paginated<TRow>>(options.endpoint, {
        params: queryParams.value,
      })
      return response.data
    },
    // Keep the current page's rows on screen while the next page loads (smooth paging).
    placeholderData: keepPreviousData,
    enabled: options.enabled,
  })

  const data = computed<TRow[]>(() => query.data.value?.data ?? [])
  const rowCount = computed(() => query.data.value?.meta.total ?? 0)
  const loading = computed(() => query.isFetching.value)

  return {
    // Bindable state — v-model these straight into <DataTable>.
    pagination,
    sorting,
    globalFilter,
    columnVisibility,
    rowSelection,
    // Server results.
    data,
    rowCount,
    loading,
    // Escape hatch for refetch/error/status.
    query,
  }
}
