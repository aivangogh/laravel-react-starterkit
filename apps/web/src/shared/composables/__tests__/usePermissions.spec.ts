import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { User } from '@app/types'
import { useAuthStore } from '@/features/auth/stores/auth'
import { usePermissions } from '@/shared/composables/usePermissions'

function makeUser(overrides: Partial<User>): User {
  return {
    id: 'u1',
    name: 'Ada',
    email: 'ada@example.com',
    email_verified_at: null,
    avatar_url: null,
    roles: [],
    permissions: [],
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as unknown as User
}

describe('usePermissions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('can() and hasRole() reflect the authenticated user', () => {
    const store = useAuthStore()
    store.user = makeUser({ roles: ['admin'], permissions: ['users.view', 'users.create'] })

    const { can, hasRole, permissions, roles } = usePermissions()

    expect(can('users.view')).toBe(true)
    expect(can('users.create')).toBe(true)
    expect(can('users.delete')).toBe(false)
    expect(hasRole('admin')).toBe(true)
    expect(hasRole('editor')).toBe(false)
    expect(permissions.value).toEqual(['users.view', 'users.create'])
    expect(roles.value).toEqual(['admin'])
  })

  it('super-admin bypasses every permission check (mirrors backend Gate::before)', () => {
    const store = useAuthStore()
    // super-admin holds NO explicit permissions — the bypass is role-based.
    store.user = makeUser({ roles: ['super-admin'], permissions: [] })

    const { can } = usePermissions()

    expect(can('users.view')).toBe(true)
    expect(can('roles.delete')).toBe(true)
    expect(can('anything.at.all')).toBe(true)
  })

  it('defaults to false / empty when logged out', () => {
    const { can, hasRole, permissions } = usePermissions()

    expect(can('users.view')).toBe(false)
    expect(hasRole('admin')).toBe(false)
    expect(permissions.value).toEqual([])
  })

  it('is reactive to the store user changing', () => {
    const store = useAuthStore()
    const { can } = usePermissions()

    expect(can('users.view')).toBe(false)
    store.user = makeUser({ permissions: ['users.view'] })
    expect(can('users.view')).toBe(true)
  })
})
