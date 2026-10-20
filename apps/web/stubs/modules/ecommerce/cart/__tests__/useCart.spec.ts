import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHookWithQuery } from '@/test/utils'
import type { Cart } from '../../types'
import { useCart } from '../hooks/useCart'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get, post: mocks.post, put: mocks.put, delete: mocks.delete },
  ensureCsrfCookie: mocks.ensureCsrfCookie,
}))

const fakeCart = {
  id: 'cart1',
  user_id: 'u1',
  total: 25800,
  items: [
    {
      id: 'line1',
      cart_id: 'cart1',
      product_id: 'p1',
      quantity: 2,
      product: {
        id: 'p1',
        category_id: 'c1',
        name: 'Trail Runner',
        slug: 'trail-runner',
        description: null,
        price: 12900,
        stock: 8,
        is_active: true,
        image_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as Cart

const CART_KEY = ['cart', 'current']

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
    mocks.get.mockResolvedValue({ data: fakeCart })
    mocks.post.mockResolvedValue({ data: fakeCart })
    mocks.put.mockResolvedValue({ data: fakeCart })
    mocks.delete.mockResolvedValue({ data: null })
  })

  it('reads the cart via GET /api/cart and derives count + subtotal', async () => {
    const { result } = renderHookWithQuery(() => useCart())

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalledWith('/api/cart'))
    await vi.waitFor(() => expect(result.current.items).toHaveLength(1))
    expect(result.current.itemCount).toBe(2)
    expect(result.current.subtotal).toBe(25800)
    expect(result.current.isEmpty).toBe(false)
  })

  it('adds an item via POST /api/cart/items, primes CSRF, and invalidates the cart', async () => {
    const { result, queryClient } = renderHookWithQuery(() => useCart())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.addItem.mutateAsync({ product_id: 'p1', quantity: 1 })

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/api/cart/items', { product_id: 'p1', quantity: 1 })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: CART_KEY })
  })

  it('updates a line via PUT /api/cart/items/{id} and invalidates the cart', async () => {
    const { result, queryClient } = renderHookWithQuery(() => useCart())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.updateItem.mutateAsync({ id: 'line1', quantity: 3 })

    expect(mocks.put).toHaveBeenCalledWith('/api/cart/items/line1', { quantity: 3 })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: CART_KEY })
  })

  it('removes a line via DELETE /api/cart/items/{id} and invalidates the cart', async () => {
    const { result, queryClient } = renderHookWithQuery(() => useCart())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.removeItem.mutateAsync('line1')

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.delete).toHaveBeenCalledWith('/api/cart/items/line1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: CART_KEY })
  })

  it('clears the cart via DELETE /api/cart and invalidates the cart', async () => {
    const { result, queryClient } = renderHookWithQuery(() => useCart())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.clearCart.mutateAsync()

    expect(mocks.delete).toHaveBeenCalledWith('/api/cart')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: CART_KEY })
  })
})
