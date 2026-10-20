import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { cartKeys, orderKeys } from '@/shared/lib/query-keys'
import type { Order } from '../../types'
import { shopPaths } from '../../lib/paths'

/**
 * Self-service checkout. `POST /api/orders` builds an order from the signed-in user's
 * cart and empties it server-side, so on success we invalidate `cartKeys.current()`
 * (the cart is now empty) and route to the confirmation page. Order data itself is
 * server state read back via `useOrder`.
 */

const ORDERS_ENDPOINT = '/api/orders'

/** Place an order from the current cart, then navigate to its confirmation. */
export function usePlaceOrder() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie()
      const { data } = await http.post<Order>(ORDERS_ENDPOINT)
      return data
    },
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.current() })
      await navigate({ to: shopPaths.confirmation(order.id) })
    },
  })
}

/** Read a placed order for the confirmation page. Disabled until an id is present. */
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await http.get<Order>(`${ORDERS_ENDPOINT}/${id}`)
      return data
    },
    enabled: Boolean(id),
  })
}
