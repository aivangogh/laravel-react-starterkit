import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import ProfileInfoForm from '@/features/profile/components/ProfileInfoForm.vue'

// The form reads validation errors through the http helpers — stub them to a 422 body.
vi.mock('@/shared/lib/http', () => ({
  getValidationErrors: () => ({ email: ['The email has already been taken.'] }),
  getErrorMessage: () => 'The given data was invalid.',
}))

// Avoid pulling in the real auth store (and vue-query) — the form only reads `user`.
vi.mock('@/features/auth/composables/useAuth', () => ({
  useAuth: () => ({ user: ref({ name: 'Ada', email: 'ada@example.com' }) }),
}))

// A mutation stub in the error state so `fieldErrors` resolves to the mocked 422 body.
vi.mock('@/features/profile/composables/useProfile', () => ({
  useProfile: () => ({
    updateProfileMutation: {
      mutate: vi.fn(),
      isPending: ref(false),
      isError: ref(true),
      isSuccess: ref(false),
      error: ref(new Error('422')),
    },
  }),
}))

describe('ProfileInfoForm', () => {
  it('renders the inline 422 field error for email', () => {
    const wrapper = mount(ProfileInfoForm)
    expect(wrapper.text()).toContain('The email has already been taken.')
  })
})
