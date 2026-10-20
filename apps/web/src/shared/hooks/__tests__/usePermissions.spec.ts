import { describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import type { User } from '@app/types'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { authKeys } from '@/shared/lib/query-keys'
import { createTestQueryClient, renderHookWithQuery } from '@/test/utils'

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

/** Run `usePermissions()` with the session user query seeded (so `useUser()` never suspends). */
function renderWithUser(user: User | null) {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(authKeys.user(), user)
  return renderHookWithQuery(() => usePermissions(), queryClient)
}

describe('usePermissions', () => {
  it('can() and hasRole() reflect the authenticated user', () => {
    const { result } = renderWithUser(
      makeUser({ roles: ['admin'], permissions: ['users.view', 'users.create'] }),
    )
    const { can, hasRole, permissions, roles } = result.current

    expect(can('users.view')).toBe(true)
    expect(can('users.create')).toBe(true)
    expect(can('users.delete')).toBe(false)
    expect(hasRole('admin')).toBe(true)
    expect(hasRole('editor')).toBe(false)
    expect(permissions).toEqual(['users.view', 'users.create'])
    expect(roles).toEqual(['admin'])
  })

  it('super-admin bypasses every permission check (mirrors backend Gate::before)', () => {
    // super-admin holds NO explicit permissions — the bypass is role-based.
    const { result } = renderWithUser(makeUser({ roles: ['super-admin'], permissions: [] }))
    const { can } = result.current

    expect(can('users.view')).toBe(true)
    expect(can('roles.delete')).toBe(true)
    expect(can('anything.at.all')).toBe(true)
  })

  it('defaults to false / empty when logged out', () => {
    const { result } = renderWithUser(null)
    const { can, hasRole, permissions } = result.current

    expect(can('users.view')).toBe(false)
    expect(hasRole('admin')).toBe(false)
    expect(permissions).toEqual([])
  })

  it('is reactive to the session user changing', async () => {
    const { result, queryClient } = renderWithUser(null)

    expect(result.current.can('users.view')).toBe(false)
    act(() => {
      queryClient.setQueryData(authKeys.user(), makeUser({ permissions: ['users.view'] }))
    })
    // Query cache notifications are batched, so the re-render lands a tick later.
    await vi.waitFor(() => expect(result.current.can('users.view')).toBe(true))
  })
})
