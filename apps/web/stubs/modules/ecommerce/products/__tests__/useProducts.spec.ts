import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import {
  useCategoryOptions,
  useCreateProduct,
  useDeleteProduct,
  useProductsTable,
  useUpdateProduct,
} from '../composables/useProducts'
import { formatMinorToMajor, majorToMinor, minorToMajorNumber } from '../lib/money'
import type { Product } from '../../types'

// Hoisted mock handles so they exist when `vi.mock`'s factory runs.
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

const fakeProduct = {
  id: 'p1',
  category_id: 'c1',
  name: 'Widget',
  slug: 'widget',
  description: null,
  price: 1299,
  stock: 5,
  is_active: true,
  image_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as unknown as Product

const createPayload = {
  name: 'Widget',
  price: 1299,
  category_id: 'c1',
  description: null,
  stock: 5,
  is_active: true,
}

/** Run a composable inside a mounted component so `useQuery`/`useMutation`/`useQueryClient` work. */
function withSetup<T>(composable: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  let result!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  )
  return { result, wrapper, queryClient }
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
  })

  it('lists products via GET /api/products using the shared table contract', async () => {
    mocks.get.mockResolvedValue({
      data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } },
    })

    withSetup(() => useProductsTable())

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(mocks.get).toHaveBeenCalledWith(
      '/api/products',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, per_page: 10 }),
      }),
    )
  })

  it('fetches category options via GET /api/categories', async () => {
    mocks.get.mockResolvedValue({
      data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
    })

    withSetup(() => useCategoryOptions(true))

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(mocks.get).toHaveBeenCalledWith(
      '/api/categories',
      expect.objectContaining({ params: expect.objectContaining({ per_page: 100 }) }),
    )
  })

  it('creates a product via POST /api/products, primes CSRF, and invalidates the list', async () => {
    mocks.post.mockResolvedValue({ data: fakeProduct })
    const { result, queryClient } = withSetup(() => useCreateProduct())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.mutateAsync(createPayload)

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/api/products', createPayload)
    // Both the server-driven table cache and the product keys are invalidated.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'products', {}] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['products'] })
  })

  it('updates a product via PUT /api/products/{id} with the minor-unit price', async () => {
    mocks.put.mockResolvedValue({ data: fakeProduct })
    const { result } = withSetup(() => useUpdateProduct())

    await result.mutateAsync({ id: 'p1', ...createPayload })

    expect(mocks.put).toHaveBeenCalledWith('/api/products/p1', createPayload)
  })

  it('deletes a product via DELETE /api/products/{id} and invalidates the list', async () => {
    mocks.delete.mockResolvedValue({ data: null })
    const { result, queryClient } = withSetup(() => useDeleteProduct())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.mutateAsync('p1')

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.delete).toHaveBeenCalledWith('/api/products/p1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'products', {}] })
  })
})

describe('money helpers', () => {
  it('formats integer minor units as a major-unit currency string', () => {
    expect(formatMinorToMajor(1299)).toContain('12.99')
    expect(formatMinorToMajor(0)).toContain('0.00')
  })

  it('round-trips major units to minor units and back', () => {
    expect(majorToMinor(12.99)).toBe(1299)
    // Guards against binary float drift (19.99 * 100 = 1998.9999… without rounding).
    expect(majorToMinor(19.99)).toBe(1999)
    expect(minorToMajorNumber(1299)).toBe(12.99)
  })
})
