import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Permission } from '@app/types'
import { renderWithQuery } from '@/test/utils'
import { RoleForm } from '@/features/roles/components/RoleForm'

// Override only `http` + `ensureCsrfCookie`; keep the real error-extraction helpers so the 422 path
// is exercised end to end (extractApiError → getValidationErrors).
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  ensureCsrf: vi.fn(),
}))

vi.mock('@/shared/lib/http', async (importActual) => {
  const actual = await importActual<typeof import('@/shared/lib/http')>()
  return {
    ...actual,
    http: { get: mocks.get, post: mocks.post, put: mocks.put, delete: mocks.delete },
    ensureCsrfCookie: mocks.ensureCsrf,
  }
})

// The real `GET /api/permissions` shape: unpaginated, unwrapped → a bare array.
const permissions: Permission[] = [
  { id: 'p1' as Permission['id'], name: 'roles.view' },
  { id: 'p2' as Permission['id'], name: 'roles.update' },
  { id: 'p3' as Permission['id'], name: 'users.view' },
  { id: 'p4' as Permission['id'], name: 'users.create' },
]

const noop = () => {}

describe('RoleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrf.mockResolvedValue(undefined)
    mocks.get.mockResolvedValue({ data: permissions })
  })

  it('renders the permission catalogue grouped by prefix', async () => {
    renderWithQuery(<RoleForm onSaved={noop} onCancel={noop} />)

    // Group headers (capitalized prefixes) and per-permission action labels are rendered.
    expect(await screen.findByText('Roles')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getAllByText('view')).toHaveLength(2)
    expect(screen.getByText('create')).toBeInTheDocument()

    // A checkbox per permission plus one master checkbox per group.
    expect(screen.getAllByRole('checkbox')).toHaveLength(permissions.length + 2)
  })

  it('surfaces a 422 validation error inline on submit', async () => {
    mocks.post.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          message: 'The given data was invalid.',
          errors: { name: ['The name has already been taken.'] },
        },
      },
    })
    const user = userEvent.setup()
    renderWithQuery(<RoleForm onSaved={noop} onCancel={noop} />)

    await user.type(screen.getByLabelText('Name'), 'admin')
    await user.click(screen.getByRole('button', { name: 'Create role' }))

    expect(mocks.post).toHaveBeenCalledWith('/api/roles', {
      name: 'admin',
      permissions: [],
    })
    expect(await screen.findByText('The name has already been taken.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
  })
})
