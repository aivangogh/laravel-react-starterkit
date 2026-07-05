import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import CreateTokenDialog from '@/features/tokens/components/CreateTokenDialog.vue'

// A fake `useTokens` whose create mutation immediately resolves with a one-time secret, so we can
// assert the dialog surfaces `plain_text_token` without touching the network or vue-query.
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
    isPending: { value: false },
    isError: { value: false },
    error: { value: null },
  }
  return { newToken, createMutation }
})

vi.mock('@/features/tokens/composables/useTokens', () => ({
  useTokens: () => ({ createMutation: fixtures.createMutation }),
}))

afterEach(() => {
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

describe('CreateTokenDialog', () => {
  it('surfaces the one-time plain_text_token after a successful create', async () => {
    const wrapper = mount(CreateTokenDialog, { attachTo: document.body })

    // Open the dialog (its content teleports into document.body).
    await wrapper.find('button').trigger('click')
    await flushPromises()

    const nameInput = document.body.querySelector<HTMLInputElement>('#token-name')
    expect(nameInput).not.toBeNull()
    nameInput!.value = 'CI deploy'
    nameInput!.dispatchEvent(new Event('input'))
    await nextTick()

    // Submit the create form.
    const form = document.body.querySelector('form')
    form!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await nextTick()

    expect(fixtures.createMutation.mutate).toHaveBeenCalledWith(
      { name: 'CI deploy', abilities: undefined },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
    // The secret is now shown exactly once, in the read-only token field.
    expect(document.body.textContent).toContain('Token created')
    const tokenField = document.body.querySelector<HTMLInputElement>('#plain-token')
    expect(tokenField).not.toBeNull()
    expect(tokenField!.value).toBe('7|super-secret-plaintext-value')

    wrapper.unmount()
  })
})
