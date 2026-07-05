import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Role } from '@app/types'
import UserForm from '@/features/users/components/UserForm.vue'

const roles = [
  { id: 'r1', name: 'admin', permissions: [] },
  { id: 'r2', name: 'editor', permissions: [] },
] as unknown as Role[]

describe('UserForm', () => {
  it('renders the create fields and the role catalogue', () => {
    const wrapper = mount(UserForm, { props: { roles } })

    expect(wrapper.find('#user-form-name').exists()).toBe(true)
    expect(wrapper.find('#user-form-email').exists()).toBe(true)
    expect(wrapper.find('#user-form-password').exists()).toBe(true)
    expect(wrapper.text()).toContain('admin')
    expect(wrapper.text()).toContain('editor')
    expect(wrapper.text()).toContain('Create user')
  })

  it('surfaces a 422 field error inline and marks the field invalid', () => {
    const wrapper = mount(UserForm, {
      props: { roles, errors: { email: ['The email has already been taken.'] } },
    })

    expect(wrapper.text()).toContain('The email has already been taken.')
    expect(wrapper.find('#user-form-email').attributes('aria-invalid')).toBe('true')
  })

  it('emits submit with the entered values', async () => {
    const wrapper = mount(UserForm, { props: { roles } })

    await wrapper.find('#user-form-name').setValue('Ada')
    await wrapper.find('#user-form-email').setValue('ada@example.com')
    await wrapper.find('#user-form-password').setValue('super-secret-123')
    await wrapper.find('form').trigger('submit')

    const submitted = wrapper.emitted('submit')
    expect(submitted).toBeTruthy()
    expect(submitted![0][0]).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'super-secret-123',
      roles: [],
    })
  })

  it('shows the "leave blank" hint and pre-fills fields in edit mode', () => {
    const user = {
      id: 'u1',
      name: 'Grace',
      email: 'grace@example.com',
      email_verified_at: null,
      avatar_url: null,
      roles: ['admin'],
      permissions: [],
      created_at: '2026-01-01T00:00:00Z',
    } as unknown as import('@app/types').User

    const wrapper = mount(UserForm, { props: { roles, user } })

    expect((wrapper.find('#user-form-name').element as HTMLInputElement).value).toBe('Grace')
    expect(wrapper.text()).toContain('Leave blank to keep the current password.')
    expect(wrapper.text()).toContain('Save changes')
  })
})
