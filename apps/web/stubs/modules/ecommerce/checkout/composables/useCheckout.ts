import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { cartKeys, orderKeys } from '@/shared/lib/query-keys'
import type { Order } from '../../types'

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
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie()
      const { data } = await http.post<Order>(ORDERS_ENDPOINT)
      return data
    },
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.current() })
      await router.push({
        name: 'ecommerce.checkout.confirmation',
        params: { id: order.id },
      })
    },
  })
}

/** Read a placed order for the confirmation page. Disabled until an id is present. */
export function useOrder(id: MaybeRefOrGetter<string | undefined>) {
  const orderId = computed(() => toValue(id))
  return useQuery({
    queryKey: computed(() => orderKeys.detail(orderId.value ?? '')),
    queryFn: async () => {
      const { data } = await http.get<Order>(`${ORDERS_ENDPOINT}/${orderId.value}`)
      return data
    },
    enabled: computed(() => Boolean(orderId.value)),
  })
}
