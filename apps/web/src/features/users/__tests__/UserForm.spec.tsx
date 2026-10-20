import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Role, User } from '@app/types'
import { UserForm } from '@/features/users/components/UserForm'

const roles = [
  { id: 'r1', name: 'admin', permissions: [] },
  { id: 'r2', name: 'editor', permissions: [] },
] as unknown as Role[]

const noop = () => {}

describe('UserForm', () => {
  it('renders the create fields and the role catalogue', () => {
    render(<UserForm roles={roles} onSubmit={noop} onCancel={noop} />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('editor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
  })

  it('surfaces a 422 field error inline and marks the field invalid', () => {
    render(
      <UserForm
        roles={roles}
        errors={{ email: 'The email has already been taken.' }}
        onSubmit={noop}
        onCancel={noop}
      />,
    )

    expect(screen.getByText('The email has already been taken.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('submits the entered values', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<UserForm roles={roles} onSubmit={onSubmit} onCancel={noop} />)

    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'super-secret-123')
    await user.click(screen.getByRole('checkbox', { name: 'editor' }))
    await user.click(screen.getByRole('button', { name: 'Create user' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'super-secret-123',
      roles: ['editor'],
    })
  })

  it('shows the "leave blank" hint and pre-fills fields in edit mode', () => {
    const existing = {
      id: 'u1',
      name: 'Grace',
      email: 'grace@example.com',
      email_verified_at: null,
      avatar_url: null,
      roles: ['admin'],
      permissions: [],
      created_at: '2026-01-01T00:00:00Z',
    } as unknown as User

    render(<UserForm roles={roles} user={existing} onSubmit={noop} onCancel={noop} />)

    expect(screen.getByLabelText('Name')).toHaveValue('Grace')
    expect(screen.getByText('Leave blank to keep the current password.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })
})
