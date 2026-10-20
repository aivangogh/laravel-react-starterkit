import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHookWithQuery } from '@/test/utils'
import type { Category, Product } from '../../types'
import { useCategories, useProduct, useProducts } from '../hooks/useCatalog'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get },
  ensureCsrfCookie: vi.fn(),
}))

const fakeProduct = {
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
} as Product

const fakeCategory = {
  id: 'c1',
  name: 'Footwear',
  slug: 'footwear',
  description: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as Category

describe('useCatalog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists products via GET /api/products forwarding the filter params', async () => {
    mocks.get.mockResolvedValue({
      data: {
        data: [fakeProduct],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
      },
    })

    const { result } = renderHookWithQuery(() => useProducts({ category_id: 'c1', q: 'trail' }))

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(mocks.get).toHaveBeenCalledWith('/api/products', {
      params: { category_id: 'c1', q: 'trail' },
    })
    await vi.waitFor(() => expect(result.current.data?.data).toEqual([fakeProduct]))
  })

  it('lists products with empty params when no filters are given', async () => {
    mocks.get.mockResolvedValue({
      data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } },
    })

    renderHookWithQuery(() => useProducts())

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(mocks.get).toHaveBeenCalledWith('/api/products', { params: {} })
  })

  it('fetches a single product via GET /api/products/{id}', async () => {
    mocks.get.mockResolvedValue({ data: fakeProduct })

    const { result } = renderHookWithQuery(() => useProduct('p1'))

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalledWith('/api/products/p1'))
    await vi.waitFor(() => expect(result.current.data).toEqual(fakeProduct))
  })

  it('does not fetch a product while the id is undefined', () => {
    renderHookWithQuery(() => useProduct(undefined))
    expect(mocks.get).not.toHaveBeenCalled()
  })

  it('lists categories via GET /api/categories and unwraps the page', async () => {
    mocks.get.mockResolvedValue({
      data: {
        data: [fakeCategory],
        meta: { current_page: 1, last_page: 1, per_page: 100, total: 1 },
      },
    })

    const { result } = renderHookWithQuery(() => useCategories())

    await vi.waitFor(() => expect(result.current.data).toEqual([fakeCategory]))
    expect(mocks.get).toHaveBeenCalledWith('/api/categories', { params: { per_page: 100 } })
  })
})
