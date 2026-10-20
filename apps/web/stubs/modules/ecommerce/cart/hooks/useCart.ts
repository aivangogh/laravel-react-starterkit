import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { cartKeys } from '@/shared/lib/query-keys'
import type { Cart } from '../../types'

/**
 * The cart is SERVER state: `/api/cart` is the single source of truth, modelled with
 * TanStack Query (no client store). Because the query cache lives above the router, the cart
 * "survives navigation" for free. Every write primes the CSRF cookie, hits its endpoint,
 * and invalidates `cartKeys.current()` so the badge, drawer, and cart page stay in sync.
 */

const CART_ENDPOINT = '/api/cart'
const CART_ITEMS_ENDPOINT = '/api/cart/items'

export interface AddToCartPayload {
  product_id: string
  quantity: number
}

export interface UpdateCartItemPayload {
  id: string
  quantity: number
}

export function useCart() {
  const queryClient = useQueryClient()

  const cartQuery = useQuery({
    queryKey: cartKeys.current(),
    queryFn: async () => {
      const { data } = await http.get<Cart>(CART_ENDPOINT)
      return data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: cartKeys.current() })

  /** Line items, defaulting to an empty list until the cart resolves. */
  const items = cartQuery.data?.items ?? []

  const addItem = useMutation({
    mutationFn: async (payload: AddToCartPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<Cart>(CART_ITEMS_ENDPOINT, payload)
      return data
    },
    onSuccess: invalidate,
  })

  const updateItem = useMutation({
    mutationFn: async ({ id, quantity }: UpdateCartItemPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.put<Cart>(`${CART_ITEMS_ENDPOINT}/${id}`, { quantity })
      return data
    },
    onSuccess: invalidate,
  })

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie()
      await http.delete(`${CART_ITEMS_ENDPOINT}/${id}`)
    },
    onSuccess: invalidate,
  })

  const clearCart = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie()
      await http.delete(CART_ENDPOINT)
    },
    onSuccess: invalidate,
  })

  return {
    cartQuery,
    items,
    /** Total number of units across all lines — drives the cart badge. */
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    /** Live subtotal in minor units, read from the server's computed `total`. */
    subtotal: cartQuery.data?.total ?? 0,
    isEmpty: items.length === 0,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  }
}
