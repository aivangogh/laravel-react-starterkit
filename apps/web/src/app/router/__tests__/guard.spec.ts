import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

// Controllable auth-store + permission mocks the guard reads. Hoisted so the `vi.mock` factories
// (which run before imports) can close over them.
const authState = vi.hoisted(() => ({
  ready: true,
  isAuthenticated: false,
  fetchUser: vi.fn(),
}))
const canMock = vi.hoisted(() => vi.fn<(permission: string) => boolean>())

vi.mock('@/features/auth/stores/auth', () => ({
  useAuthStore: () => authState,
}))
vi.mock('@/shared/composables/usePermissions', () => ({
  usePermissions: () => ({ can: canMock }),
}))

import { authGuard } from '@/app/router'

function route(meta: Record<string, unknown>, fullPath = '/target'): RouteLocationNormalized {
  return { meta, fullPath } as unknown as RouteLocationNormalized
}

describe('authGuard', () => {
  beforeEach(() => {
    authState.ready = true
    authState.isAuthenticated = false
    authState.fetchUser.mockReset()
    canMock.mockReset().mockReturnValue(false)
  })

  it('redirects an unauthenticated user off a protected route to login, preserving the path', async () => {
    const result = await authGuard(route({ requiresAuth: true }, '/reports/42'))

    expect(result).toEqual({ name: 'login', query: { redirect: '/reports/42' } })
  })

  it('redirects an authenticated user lacking the required permission to forbidden', async () => {
    authState.isAuthenticated = true
    canMock.mockReturnValue(false)

    const result = await authGuard(route({ requiresAuth: true, permission: 'users.view' }))

    expect(canMock).toHaveBeenCalledWith('users.view')
    expect(result).toEqual({ name: 'forbidden' })
  })

  it('allows an authenticated user who holds the required permission', async () => {
    authState.isAuthenticated = true
    canMock.mockReturnValue(true)

    const result = await authGuard(route({ requiresAuth: true, permission: 'users.view' }))

    expect(result).toBe(true)
  })

  it('sends an authenticated user away from guest-only routes', async () => {
    authState.isAuthenticated = true

    const result = await authGuard(route({ guestOnly: true }))

    expect(result).toEqual({ name: 'home' })
  })

  it('waits for the session before deciding when the store is not yet ready', async () => {
    authState.ready = false
    authState.fetchUser.mockImplementation(async () => {
      authState.ready = true
      authState.isAuthenticated = true
    })

    const result = await authGuard(route({ requiresAuth: true }))

    expect(authState.fetchUser).toHaveBeenCalledTimes(1)
    expect(result).toBe(true)
  })
})
