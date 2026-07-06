import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { orderKeys, tableKeys } from '@/shared/lib/query-keys'
import { useServerTable } from '@/shared/composables/useServerTable'
import type { Order, OrderStatus } from '../../types'

/**
 * Orders feature server-state (admin/back-office). Every call goes through the shared `http`
 * client (never raw axios) and TanStack Query owns the cache — the components stay presentational.
 *
 * Endpoints (issue #27 contract): the SPA's `http` base URL has no `/api` prefix, so the paths are
 * spelled out in full here. Money is always in integer minor units (cents).
 */
const ORDERS_RESOURCE = 'orders'
const ORDERS_ENDPOINT = '/api/orders'

/** Status-update payload — the only mutable field on an order is its lifecycle status. */
export interface UpdateOrderStatusPayload {
  id: string
  status: OrderStatus
}

/**
 * The server-driven orders list. Thin wrapper over the shared `useServerTable`, which standardises
 * the `page`/`per_page`/`sort`/`dir`/`q` contract every index endpoint reads. Bind the returned
 * refs straight into `<DataTable>`. The index eager-loads `items`, so row `items.length` is a live
 * line count.
 */
export function useOrdersTable() {
  return useServerTable<Order>({ resource: ORDERS_RESOURCE, endpoint: ORDERS_ENDPOINT })
}

/**
 * A single order with its line items (`GET /api/orders/{id}` → Order). Keyed on
 * `orderKeys.detail(id)`; disabled until an id is present so the detail dialog can defer the
 * request until it is actually opened for a row.
 */
export function useOrderDetail(id: MaybeRefOrGetter<string | null>) {
  return useQuery({
    queryKey: computed(() => orderKeys.detail(toValue(id) ?? '')),
    queryFn: async () => {
      const { data } = await http.get<Order>(`${ORDERS_ENDPOINT}/${toValue(id)}`)
      return data
    },
    enabled: () => toValue(id) != null,
  })
}

/**
 * Invalidate every cached view of the orders resource after a write: the server-driven table pages
 * (all param variants, matched by prefix) and the `orderKeys` list/detail caches.
 */
function useInvalidateOrders() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tableKeys.list(ORDERS_RESOURCE) }),
      queryClient.invalidateQueries({ queryKey: orderKeys.all }),
    ])
}

/** Update an order's status (`PUT /api/orders/{id}` → Order). Invalidates the list + detail. */
export function useUpdateOrderStatus() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: async ({ id, status }: UpdateOrderStatusPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.put<Order>(`${ORDERS_ENDPOINT}/${id}`, { status })
      return data
    },
    onSuccess: invalidate,
  })
}

/** Delete an order (`DELETE /api/orders/{id}` → 204). Invalidates the list + detail. */
export function useDeleteOrder() {
  const invalidate = useInvalidateOrders()
  return useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie()
      await http.delete(`${ORDERS_ENDPOINT}/${id}`)
    },
    onSuccess: invalidate,
  })
}
