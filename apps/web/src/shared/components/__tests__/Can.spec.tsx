import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { User } from '@app/types'
import { Can } from '@/shared/components/Can'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { authKeys } from '@/shared/lib/query-keys'
import { createTestQueryClient, renderWithQuery } from '@/test/utils'

function makeUser(permissions: string[], roles: string[] = []): User {
  return {
    id: 'u1',
    name: 'Ada',
    email: 'ada@example.com',
    email_verified_at: null,
    avatar_url: null,
    roles,
    permissions,
    created_at: '2026-01-01T00:00:00Z',
  } as unknown as User
}

/** Render `ui` with the session user query seeded with `user`. */
function renderAs(user: User | null, ui: ReactNode) {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(authKeys.user(), user)
  return renderWithQuery(ui, queryClient)
}

/** The "disable instead of hide" pattern (the old `v-can.disable`): `disabled={!can(perm)}`. */
function DisableIfMissing({ permission }: { permission: string }) {
  const { can } = usePermissions()
  return <button disabled={!can(permission)}>Action</button>
}

describe('<Can>', () => {
  it('renders its children when the user holds the permission', () => {
    renderAs(
      makeUser(['users.view']),
      <Can permission="users.view">
        <button>Action</button>
      </Can>,
    )
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('renders nothing when the permission is missing', () => {
    renderAs(
      makeUser(['orders.view']),
      <Can permission="users.view">
        <button>Action</button>
      </Can>,
    )
    expect(screen.queryByRole('button', { name: 'Action' })).not.toBeInTheDocument()
  })

  it('renders the fallback when the permission is missing', () => {
    renderAs(
      null,
      <Can permission="users.view" fallback={<p>No access</p>}>
        <button>Action</button>
      </Can>,
    )
    expect(screen.queryByRole('button', { name: 'Action' })).not.toBeInTheDocument()
    expect(screen.getByText('No access')).toBeInTheDocument()
  })

  it('lets super-admin through without explicit permissions', () => {
    renderAs(
      makeUser([], ['super-admin']),
      <Can permission="users.delete">
        <button>Action</button>
      </Can>,
    )
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('disable pattern: disables (not hides) when the permission is missing', () => {
    renderAs(makeUser(['users.view']), <DisableIfMissing permission="users.delete" />)
    expect(screen.getByRole('button', { name: 'Action' })).toBeDisabled()
  })

  it('disable pattern: leaves the element enabled when the permission is present', () => {
    renderAs(makeUser(['users.delete']), <DisableIfMissing permission="users.delete" />)
    expect(screen.getByRole('button', { name: 'Action' })).toBeEnabled()
  })
})
