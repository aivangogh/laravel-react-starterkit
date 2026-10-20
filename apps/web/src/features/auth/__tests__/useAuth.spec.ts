import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import type { User } from '@app/types'
import { fetchUser, useLogin, useLogout, useRegister } from '@/features/auth/hooks/useAuth'
import { authKeys, userKeys } from '@/shared/lib/query-keys'
import { renderHookWithQuery } from '@/test/utils'

// Hoisted mock handles so they exist when `vi.mock`'s factory runs.
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}))

// Keep the real `isApiError` (fetchUser's 401/419 detection); stub only the transport.
vi.mock('@/shared/lib/http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/http')>()),
  http: { get: mocks.get, post: mocks.post },
  ensureCsrfCookie: mocks.ensureCsrfCookie,
}))

const fakeUser = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@example.com',
  email_verified_at: null,
  avatar_url: null,
  roles: ['admin'],
  permissions: ['users.view'],
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User

/** An axios error carrying an HTTP `status`, as the real client throws. */
function httpError(status: number) {
  return new AxiosError(`Request failed with status code ${status}`, undefined, undefined, null, {
    status,
  } as AxiosResponse)
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
  })

  it('fetchUser returns the session user from GET /api/user', async () => {
    mocks.get.mockResolvedValueOnce({ data: fakeUser })

    expect(await fetchUser()).toEqual(fakeUser)
    expect(mocks.get).toHaveBeenCalledWith('/api/user')
  })

  it.each([401, 419])('fetchUser treats a %i as logged out (null)', async (status) => {
    mocks.get.mockRejectedValueOnce(httpError(status))

    expect(await fetchUser()).toBeNull()
  })

  it('fetchUser rethrows any other failure instead of logging the user out', async () => {
    const error = httpError(500)
    mocks.get.mockRejectedValueOnce(error)

    await expect(fetchUser()).rejects.toBe(error)
  })

  it('login primes CSRF, POSTs /login, then fetches the user into the cache', async () => {
    mocks.post.mockResolvedValueOnce({ data: {} })
    mocks.get.mockResolvedValueOnce({ data: fakeUser })
    const { result, queryClient } = renderHookWithQuery(() => useLogin())

    await result.current.mutateAsync({ email: 'ada@example.com', password: 'secret' })

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/login', {
      email: 'ada@example.com',
      password: 'secret',
    })
    expect(mocks.get).toHaveBeenCalledWith('/api/user')
    expect(queryClient.getQueryData(authKeys.user())).toEqual(fakeUser)
  })

  it('register primes CSRF, POSTs /register, then fetches the user into the cache', async () => {
    mocks.post.mockResolvedValueOnce({ data: {} })
    mocks.get.mockResolvedValueOnce({ data: fakeUser })
    const { result, queryClient } = renderHookWithQuery(() => useRegister())

    await result.current.mutateAsync({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'secret123',
      password_confirmation: 'secret123',
    })

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith(
      '/register',
      expect.objectContaining({ email: 'ada@example.com' }),
    )
    expect(queryClient.getQueryData(authKeys.user())).toEqual(fakeUser)
  })

  it('logout POSTs /logout, drops every cached response and sets the user to null', async () => {
    mocks.post.mockResolvedValueOnce({ data: {} })
    const { result, queryClient } = renderHookWithQuery(() => useLogout())
    queryClient.setQueryData(authKeys.user(), fakeUser)
    queryClient.setQueryData(userKeys.list(), { data: [fakeUser] })

    await result.current.mutateAsync()

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/logout')
    expect(queryClient.getQueryData(userKeys.list())).toBeUndefined()
    expect(queryClient.getQueryData(authKeys.user())).toBeNull()
  })
})
