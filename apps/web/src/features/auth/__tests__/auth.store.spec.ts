import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { User } from '@app/types'
import { useAuthStore } from '@/features/auth/stores/auth'

// Hoisted mock handles so they exist when `vi.mock`'s factory runs.
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}))

vi.mock('@/shared/lib/http', () => ({
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

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
  })

  it('fetchUser stores the user and flips ready on success', async () => {
    mocks.get.mockResolvedValueOnce({ data: fakeUser })
    const store = useAuthStore()

    expect(store.ready).toBe(false)
    const result = await store.fetchUser()

    expect(mocks.get).toHaveBeenCalledWith('/api/user')
    expect(result).toEqual(fakeUser)
    expect(store.user).toEqual(fakeUser)
    expect(store.isAuthenticated).toBe(true)
    expect(store.ready).toBe(true)
  })

  it('fetchUser tolerates a 401 by resetting to logged-out, ready still flips', async () => {
    mocks.get.mockRejectedValueOnce(new Error('Request failed with status code 401'))
    const store = useAuthStore()

    const result = await store.fetchUser()

    expect(result).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.ready).toBe(true)
  })

  it('login primes CSRF, POSTs /login, then fetches the user', async () => {
    mocks.post.mockResolvedValueOnce({ data: {} })
    mocks.get.mockResolvedValueOnce({ data: fakeUser })
    const store = useAuthStore()

    await store.login({ email: 'ada@example.com', password: 'secret' })

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/login', {
      email: 'ada@example.com',
      password: 'secret',
    })
    expect(mocks.get).toHaveBeenCalledWith('/api/user')
    expect(store.user).toEqual(fakeUser)
    expect(store.isAuthenticated).toBe(true)
  })

  it('register primes CSRF, POSTs /register, then fetches the user', async () => {
    mocks.post.mockResolvedValueOnce({ data: {} })
    mocks.get.mockResolvedValueOnce({ data: fakeUser })
    const store = useAuthStore()

    await store.register({
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
    expect(store.user).toEqual(fakeUser)
  })

  it('logout POSTs /logout and clears the user', async () => {
    mocks.get.mockResolvedValueOnce({ data: fakeUser })
    const store = useAuthStore()
    await store.fetchUser()
    expect(store.isAuthenticated).toBe(true)

    mocks.post.mockResolvedValueOnce({ data: {} })
    await store.logout()

    expect(mocks.post).toHaveBeenCalledWith('/logout')
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
