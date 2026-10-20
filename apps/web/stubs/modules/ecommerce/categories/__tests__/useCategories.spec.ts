import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHookWithQuery } from '@/test/utils'
import {
  useCategoriesTable,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../hooks/useCategories'
import type { Category } from '../../types'

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

const fakeCategory = {
  id: 'c1',
  name: 'Widgets',
  slug: 'widgets',
  description: 'All the widgets',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as unknown as Category

const createPayload = { name: 'Widgets', description: 'All the widgets' }

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
  })

  it('lists categories via GET /api/categories using the shared table contract', async () => {
    mocks.get.mockResolvedValue({
      data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } },
    })

    renderHookWithQuery(() => useCategoriesTable())

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(mocks.get).toHaveBeenCalledWith(
      '/api/categories',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, per_page: 10 }),
      }),
    )
  })

  it('creates a category via POST /api/categories, primes CSRF, and invalidates the list', async () => {
    mocks.post.mockResolvedValue({ data: fakeCategory })
    const { result, queryClient } = renderHookWithQuery(() => useCreateCategory())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.mutateAsync(createPayload)

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/api/categories', createPayload)
    // Both the server-driven table cache and the category keys are invalidated.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'categories', {}] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['categories'] })
  })

  it('updates a category via PUT /api/categories/{id}', async () => {
    mocks.put.mockResolvedValue({ data: fakeCategory })
    const { result } = renderHookWithQuery(() => useUpdateCategory())

    await result.current.mutateAsync({ id: 'c1', ...createPayload })

    expect(mocks.put).toHaveBeenCalledWith('/api/categories/c1', createPayload)
  })

  it('deletes a category via DELETE /api/categories/{id} and invalidates the list', async () => {
    mocks.delete.mockResolvedValue({ data: null })
    const { result, queryClient } = renderHookWithQuery(() => useDeleteCategory())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.mutateAsync('c1')

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.delete).toHaveBeenCalledWith('/api/categories/c1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'categories', {}] })
  })
})
