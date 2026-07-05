import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Paginated, Permission } from '@app/types'
import RoleForm from '@/features/roles/components/RoleForm.vue'

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

const permissionsPage: Paginated<Permission> = {
  data: [
    { id: 'p1' as Permission['id'], name: 'roles.view' },
    { id: 'p2' as Permission['id'], name: 'roles.update' },
    { id: 'p3' as Permission['id'], name: 'users.view' },
    { id: 'p4' as Permission['id'], name: 'users.create' },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 100, total: 4 },
}

function mountForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return mount(RoleForm, {
    props: { role: null },
    global: { plugins: [[VueQueryPlugin, { queryClient: client }]] },
  })
}

describe('RoleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrf.mockResolvedValue(undefined)
    mocks.get.mockResolvedValue({ data: permissionsPage })

    // reka-ui primitives (Checkbox) reference browser APIs jsdom lacks.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    Element.prototype.hasPointerCapture = vi.fn()
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the permission catalogue grouped by prefix', async () => {
    const wrapper = mountForm()
    await flushPromises()

    // Group headers (capitalized prefixes) and per-permission action labels are rendered.
    const text = wrapper.text()
    expect(text).toContain('Roles')
    expect(text).toContain('Users')
    expect(text).toContain('view')
    expect(text).toContain('create')

    // A checkbox per permission plus one master checkbox per group.
    const checkboxes = wrapper.findAll('[data-slot="checkbox"]')
    expect(checkboxes.length).toBe(permissionsPage.data.length + 2)
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

    const wrapper = mountForm()
    await flushPromises()

    await wrapper.get('#role-name').setValue('admin')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(mocks.post).toHaveBeenCalledWith('/api/roles', {
      name: 'admin',
      permissions: [],
    })
    expect(wrapper.text()).toContain('The name has already been taken.')
  })
})
