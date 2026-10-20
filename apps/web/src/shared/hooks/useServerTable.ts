import { useCallback, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Paginated } from '@app/types'
import type { DataTableProps, PaginationState, SortingState } from '@app/ui/components/data-table'
import { http } from '@/shared/lib/http'
import { tableKeys } from '@/shared/lib/query-keys'

/**
 * A list response: `Paginated<T>`, or — for small sets the API doesn't paginate (e.g. `GET /api/tokens`)
 * — a bare `T[]` (the backend calls `JsonResource::withoutWrapping()`, so unpaginated collections
 * have no `{ data }` envelope). The bare form is normalised to `{ data }` and counted by length.
 */
type ListResponse<T> = Omit<Paginated<T>, 'meta'> & Partial<Pick<Paginated<T>, 'meta'>>

export interface UseServerTableOptions {
  /** Query-key namespace for this resource, e.g. `'users'`. */
  resource: string
  /** List endpoint path passed to `http.get`, e.g. `'/api/users'`. */
  endpoint: string
  /** Initial rows-per-page (defaults to 10). */
  initialPageSize?: number
  /** Extra query params merged into every request (e.g. a fixed filter). */
  params?: Record<string, unknown>
  /** Gate the query (defaults to enabled). */
  enabled?: boolean
}

/** The server-driven slice of `<DataTable>` props this hook owns — spread it straight in. */
export type ServerTableProps = Pick<
  DataTableProps<unknown, unknown>,
  | 'rowCount'
  | 'loading'
  | 'pagination'
  | 'onPaginationChange'
  | 'sorting'
  | 'onSortingChange'
  | 'globalFilter'
  | 'onGlobalFilterChange'
>

/**
 * App-side glue for the `@app/ui` `DataTable`. It owns the table state, runs a TanStack `useQuery`
 * keyed on that state, and maps rows/`meta.total` back out — the DataTable stays presentational
 * and does no fetching.
 *
 * This is THE single place that standardises the list-endpoint contract. Every server-driven
 * list table sends the same query params, so every index endpoint reads the same way:
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
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: options.initialPageSize ?? 10,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // A new search term always returns to the first page. Stable identity: the DataTable's debounce
  // effect depends on it.
  const onGlobalFilterChange = useCallback((value: string) => {
    setGlobalFilter(value)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [])

  // The single source of the list-endpoint query params (see the doc block above).
  const sort = sorting[0]
  const queryParams: Record<string, unknown> = {
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    ...(sort ? { sort: sort.id, dir: sort.desc ? 'desc' : 'asc' } : {}),
    ...(globalFilter ? { q: globalFilter } : {}),
    ...options.params,
  }

  const query = useQuery({
    queryKey: tableKeys.list(options.resource, queryParams),
    queryFn: async () => {
      const response = await http.get<ListResponse<TRow> | TRow[]>(options.endpoint, {
        params: queryParams,
      })
      const body = response.data
      return Array.isArray(body) ? ({ data: body } as ListResponse<TRow>) : body
    },
    // Keep the current page's rows on screen while the next page loads (smooth paging).
    placeholderData: keepPreviousData,
    enabled: options.enabled,
  })

  const tableProps: ServerTableProps = {
    rowCount: query.data?.meta?.total ?? query.data?.data.length ?? 0,
    loading: query.isFetching,
    pagination,
    onPaginationChange: setPagination,
    sorting,
    onSortingChange: setSorting,
    globalFilter,
    onGlobalFilterChange,
  }

  return {
    /** Rows for the current page. */
    data: query.data?.data ?? [],
    /** Spread into `<DataTable>`: `<DataTable columns={columns} data={data} {...tableProps} />`. */
    tableProps,
    /** Escape hatch for refetch/error/status. */
    query,
  }
}
