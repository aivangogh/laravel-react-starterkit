import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { User } from '@app/types'
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsersTable,
} from '@/features/users/composables/useUsers'

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

const fakeUser = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@example.com',
  email_verified_at: null,
  avatar_url: null,
  roles: ['admin'],
  permissions: [],
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User

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

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
  })

  it('lists users via GET /api/users using the shared table contract', async () => {
    mocks.get.mockResolvedValue({
      data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } },
    })

    withSetup(() => useUsersTable())

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())
    expect(mocks.get).toHaveBeenCalledWith(
      '/api/users',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, per_page: 10 }),
      }),
    )
  })

  it('creates a user via POST /api/users, primes CSRF, and invalidates the list', async () => {
    mocks.post.mockResolvedValue({ data: fakeUser })
    const { result, queryClient } = withSetup(() => useCreateUser())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    const payload = {
      name: 'Ada',
      email: 'ada@example.com',
      password: 'super-secret-123',
      roles: ['admin'],
    }
    await result.mutateAsync(payload)

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/api/users', payload)
    expect(invalidate).toHaveBeenCalled()
    // Both the server-driven table cache and the user keys are invalidated.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'users', {}] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['users'] })
  })

  it('updates a user via PUT /api/users/{id} and omits a blank password', async () => {
    mocks.put.mockResolvedValue({ data: fakeUser })
    const { result } = withSetup(() => useUpdateUser())

    await result.mutateAsync({
      id: 'u1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      roles: ['editor'],
    })

    expect(mocks.put).toHaveBeenCalledWith('/api/users/u1', {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      roles: ['editor'],
    })
  })

  it('includes the password on update when provided', async () => {
    mocks.put.mockResolvedValue({ data: fakeUser })
    const { result } = withSetup(() => useUpdateUser())

    await result.mutateAsync({
      id: 'u1',
      name: 'Ada',
      email: 'ada@example.com',
      password: 'new-password-123',
      roles: [],
    })

    expect(mocks.put).toHaveBeenCalledWith('/api/users/u1', {
      name: 'Ada',
      email: 'ada@example.com',
      password: 'new-password-123',
      roles: [],
    })
  })

  it('deletes a user via DELETE /api/users/{id} and invalidates the list', async () => {
    mocks.delete.mockResolvedValue({ data: null })
    const { result, queryClient } = withSetup(() => useDeleteUser())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.mutateAsync('u1')

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.delete).toHaveBeenCalledWith('/api/users/u1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'users', {}] })
  })
})
