import { describe, expect, it } from 'vitest'
import { defineComponent, h, withDirectives } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import type { User } from '@app/types'
import { useAuthStore } from '@/features/auth/stores/auth'
import { vCan } from '@/shared/directives/can'

function makeUser(permissions: string[]): User {
  return {
    id: 'u1',
    name: 'Ada',
    email: 'ada@example.com',
    email_verified_at: null,
    avatar_url: null,
    roles: [],
    permissions,
    created_at: '2026-01-01T00:00:00Z',
  } as unknown as User
}

/** Mount a bare `<button v-can[.disable]="perm">` with the store seeded with `permissions`. */
function render(perm: string, permissions: string[], disable = false) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().user = makeUser(permissions)

  const Harness = defineComponent({
    setup() {
      return () =>
        withDirectives(h('button', 'Action'), [[vCan, perm, '', disable ? { disable: true } : {}]])
    },
  })

  return mount(Harness, { global: { plugins: [pinia] } })
}

describe('v-can directive', () => {
  it('shows the element when the user holds the permission', () => {
    const wrapper = render('users.view', ['users.view'])
    expect(wrapper.find('button').element.style.display).not.toBe('none')
  })

  it('hides the element (display:none) when the permission is missing', () => {
    const wrapper = render('users.view', ['orders.view'])
    expect(wrapper.find('button').element.style.display).toBe('none')
  })

  it('.disable modifier disables (not hides) when the permission is missing', () => {
    const wrapper = render('users.delete', ['users.view'], true)
    const button = wrapper.find('button')
    expect(button.element.style.display).not.toBe('none')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-disabled')).toBe('true')
  })

  it('.disable modifier leaves the element enabled when the permission is present', () => {
    const wrapper = render('users.delete', ['users.delete'], true)
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })
})
