import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHookWithQuery } from '@/test/utils'
import type { Order } from '../../types'
import { useOrder, usePlaceOrder } from '../hooks/useCheckout'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  ensureCsrfCookie: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get, post: mocks.post },
  ensureCsrfCookie: mocks.ensureCsrfCookie,
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mocks.navigate,
}))

const fakeOrder = {
  id: 'order-123',
  user_id: 'u1',
  status: 'pending',
  total: 25800,
  items: [
    {
      id: 'oi1',
      order_id: 'order-123',
      product_id: 'p1',
      name: 'Trail Runner',
      unit_price: 12900,
      quantity: 2,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as Order

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
    mocks.navigate.mockResolvedValue(undefined)
  })

  it('places an order via POST /api/orders, empties the cart, and routes to confirmation', async () => {
    mocks.post.mockResolvedValue({ data: fakeOrder })
    const { result, queryClient } = renderHookWithQuery(() => usePlaceOrder())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.mutateAsync()

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/api/orders')
    // Cart is now empty server-side → its cache is invalidated.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart', 'current'] })
    // Then navigate to the new order's confirmation.
    expect(mocks.navigate).toHaveBeenCalledWith({ to: '/checkout/confirmation/order-123' })
  })

  it('reads a placed order via GET /api/orders/{id}', async () => {
    mocks.get.mockResolvedValue({ data: fakeOrder })

    const { result } = renderHookWithQuery(() => useOrder('order-123'))

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalledWith('/api/orders/order-123'))
    await vi.waitFor(() => expect(result.current.data).toEqual(fakeOrder))
  })

  it('does not fetch an order while the id is undefined', () => {
    renderHookWithQuery(() => useOrder(undefined))
    expect(mocks.get).not.toHaveBeenCalled()
  })
})
