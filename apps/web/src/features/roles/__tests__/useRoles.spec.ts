import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Paginated, Permission, Role } from '@app/types'
import {
  isSystemRole,
  useCreateRole,
  useDeleteRole,
  usePermissionCatalogue,
  useRolesTable,
  useUpdateRole,
} from '@/features/roles/composables/useRoles'

// Hoisted http mock so `vi.mock`'s factory can reference it. `ensureCsrfCookie` is stubbed too so
// the write mutations don't hit the real Sanctum priming call.
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  ensureCsrf: vi.fn(),
}))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get, post: mocks.post, put: mocks.put, delete: mocks.delete },
  ensureCsrfCookie: mocks.ensureCsrf,
}))

const rolesPage: Paginated<Role> = {
  data: [
    { id: '1' as Role['id'], name: 'admin', permissions: ['roles.view', 'roles.update'] },
    { id: '2' as Role['id'], name: 'editor', permissions: ['roles.view'] },
  ],
  meta: { current_page: 1, last_page: 3, per_page: 10, total: 24 },
}

const permissionsPage: Paginated<Permission> = {
  data: [
    { id: 'p1' as Permission['id'], name: 'roles.view' },
    { id: 'p2' as Permission['id'], name: 'roles.update' },
    { id: 'p3' as Permission['id'], name: 'users.view' },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 100, total: 3 },
}

/** Run a composable inside a real setup + QueryClient, exposing the client to spy on invalidation. */
function withSetup<T>(composable: () => T) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
  let result!: T

  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } },
  )

  return { wrapper, result: () => result, invalidateSpy }
}

describe('useRoles composables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrf.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('useRolesTable requests the roles list with the standard table params', async () => {
    mocks.get.mockResolvedValue({ data: rolesPage })

    const { result } = withSetup(() => useRolesTable())
    await flushPromises()

    expect(mocks.get).toHaveBeenCalledWith('/api/roles', {
      params: { page: 1, per_page: 10 },
    })
    expect(result().data.value).toEqual(rolesPage.data)
    expect(result().rowCount.value).toBe(24)
  })

  it('usePermissionCatalogue fetches the full permission list and maps to the array', async () => {
    mocks.get.mockResolvedValue({ data: permissionsPage })

    const { result } = withSetup(() => usePermissionCatalogue())
    await flushPromises()

    expect(mocks.get).toHaveBeenCalledWith('/api/permissions', { params: { per_page: 100 } })
    expect(result().data.value).toEqual(permissionsPage.data)
  })

  it('useCreateRole POSTs the payload and invalidates the roles caches', async () => {
    mocks.post.mockResolvedValue({ data: rolesPage.data[1] })

    const { result, invalidateSpy } = withSetup(() => useCreateRole())
    await result().mutateAsync({ name: 'editor', permissions: ['roles.view'] })

    expect(mocks.ensureCsrf).toHaveBeenCalledOnce()
    expect(mocks.post).toHaveBeenCalledWith('/api/roles', {
      name: 'editor',
      permissions: ['roles.view'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['table', 'roles', {}] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['roles'] })
  })

  it('useUpdateRole PUTs to the role id with the payload', async () => {
    mocks.put.mockResolvedValue({ data: rolesPage.data[0] })

    const { result, invalidateSpy } = withSetup(() => useUpdateRole())
    await result().mutateAsync({
      id: '1',
      payload: { name: 'admin', permissions: ['roles.view', 'roles.update'] },
    })

    expect(mocks.ensureCsrf).toHaveBeenCalledOnce()
    expect(mocks.put).toHaveBeenCalledWith('/api/roles/1', {
      name: 'admin',
      permissions: ['roles.view', 'roles.update'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['table', 'roles', {}] })
  })

  it('useDeleteRole DELETEs the role id and invalidates', async () => {
    mocks.delete.mockResolvedValue({ data: null })

    const { result, invalidateSpy } = withSetup(() => useDeleteRole())
    await result().mutateAsync('2')

    expect(mocks.ensureCsrf).toHaveBeenCalledOnce()
    expect(mocks.delete).toHaveBeenCalledWith('/api/roles/2')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['roles'] })
  })

  it('isSystemRole flags seeded roles case-insensitively', () => {
    expect(isSystemRole('admin')).toBe(true)
    expect(isSystemRole('Super-Admin')).toBe(true)
    expect(isSystemRole('editor')).toBe(false)
  })
})
