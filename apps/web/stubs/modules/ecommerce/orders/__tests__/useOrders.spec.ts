import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Order } from '../../types'
import {
  useDeleteOrder,
  useOrderDetail,
  useOrdersTable,
  useUpdateOrderStatus,
} from '../composables/useOrders'

// Hoisted mock handles so they exist when `vi.mock`'s factory runs.
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get, put: mocks.put, delete: mocks.delete },
  ensureCsrfCookie: mocks.ensureCsrfCookie,
}))

const fakeOrder = {
  id: 'o1',
  user_id: 'u1',
  status: 'pending',
  total: 4200,
  items: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as unknown as Order

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

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
  })

  it('lists orders via GET /api/orders using the shared table contract', async () => {
    mocks.get.mockResolvedValue({
      data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } },
    })

    withSetup(() => useOrdersTable())

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(mocks.get).toHaveBeenCalledWith(
      '/api/orders',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, per_page: 10 }),
      }),
    )
  })

  it('fetches a single order via GET /api/orders/{id} when an id is provided', async () => {
    mocks.get.mockResolvedValue({ data: fakeOrder })

    withSetup(() => useOrderDetail('o1'))

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(mocks.get).toHaveBeenCalledWith('/api/orders/o1')
  })

  it('does not fetch the detail while the id is null (dialog closed)', async () => {
    mocks.get.mockResolvedValue({ data: fakeOrder })

    withSetup(() => useOrderDetail(null))

    // Give the query a chance to (not) run.
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(mocks.get).not.toHaveBeenCalled()
  })

  it('updates status via PUT /api/orders/{id}, primes CSRF, and invalidates list + detail', async () => {
    mocks.put.mockResolvedValue({ data: { ...fakeOrder, status: 'shipped' } })
    const { result, queryClient } = withSetup(() => useUpdateOrderStatus())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.mutateAsync({ id: 'o1', status: 'shipped' })

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.put).toHaveBeenCalledWith('/api/orders/o1', { status: 'shipped' })
    // Both the server-driven table cache and the order keys are invalidated.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'orders', {}] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders'] })
  })

  it('deletes an order via DELETE /api/orders/{id}, primes CSRF, and invalidates list + detail', async () => {
    mocks.delete.mockResolvedValue({ data: null })
    const { result, queryClient } = withSetup(() => useDeleteOrder())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.mutateAsync('o1')

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.delete).toHaveBeenCalledWith('/api/orders/o1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'orders', {}] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders'] })
  })
})
