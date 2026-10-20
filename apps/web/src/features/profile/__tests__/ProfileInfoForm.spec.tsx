import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfileInfoForm } from '@/features/profile/components/ProfileInfoForm'

// The form reads validation errors through the http helpers — stub them to a 422 body.
vi.mock('@/shared/lib/http', () => ({
  getValidationErrors: () => ({ email: ['The email has already been taken.'] }),
  getErrorMessage: () => 'The given data was invalid.',
}))

// Avoid pulling in the real session query — the form only reads the user.
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useUser: () => ({ name: 'Ada', email: 'ada@example.com' }),
}))

// A mutation stub in the error state so the field errors resolve to the mocked 422 body.
vi.mock('@/features/profile/hooks/useProfile', () => ({
  useUpdateProfile: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    error: new Error('422'),
  }),
}))

describe('ProfileInfoForm', () => {
  it('renders the inline 422 field error for email', () => {
    render(<ProfileInfoForm />)
    expect(screen.getByText('The email has already been taken.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com')
  })
})
