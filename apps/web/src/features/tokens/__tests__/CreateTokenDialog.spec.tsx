import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateTokenDialog } from '@/features/tokens/components/CreateTokenDialog'

// A fake `useTokens` whose create mutation immediately resolves with a one-time secret, so we can
// assert the dialog surfaces `plain_text_token` without touching the network or react-query.
const fixtures = vi.hoisted(() => {
  const newToken = {
    id: 7,
    name: 'CI deploy',
    abilities: ['*'],
    last_used_at: null,
    expires_at: null,
    created_at: '2026-01-01T00:00:00Z',
    plain_text_token: '7|super-secret-plaintext-value',
  }
  const createMutation = {
    mutate: vi.fn((_payload: unknown, opts?: { onSuccess?: (token: unknown) => void }) =>
      opts?.onSuccess?.(newToken),
    ),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }
  return { newToken, createMutation }
})

vi.mock('@/features/tokens/hooks/useTokens', () => ({
  useTokens: () => ({ createMutation: fixtures.createMutation }),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('CreateTokenDialog', () => {
  it('surfaces the one-time plain_text_token after a successful create', async () => {
    const user = userEvent.setup()
    render(<CreateTokenDialog />)

    // Open the dialog (its content portals into document.body).
    await user.click(screen.getByRole('button', { name: 'Create token' }))

    await user.type(await screen.findByLabelText('Name'), 'CI deploy')
    await user.click(screen.getByRole('button', { name: 'Create token' }))

    expect(fixtures.createMutation.mutate).toHaveBeenCalledWith(
      { name: 'CI deploy', abilities: undefined },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
    // The secret is now shown exactly once, in the read-only token field.
    expect(await screen.findByText('Token created')).toBeInTheDocument()
    expect(screen.getByLabelText('Token')).toHaveValue('7|super-secret-plaintext-value')
  })
})
