import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Paginated, Permission, Role } from '@app/types'
import { renderHookWithQuery } from '@/test/utils'
import {
  isSystemRole,
  useCreateRole,
  useDeleteRole,
  usePermissionCatalogue,
  useRolesTable,
  useUpdateRole,
} from '@/features/roles/hooks/useRoles'

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

// The real endpoint shape: unpaginated, unwrapped → a bare array.
const permissions: Permission[] = [
  { id: 'p1' as Permission['id'], name: 'roles.view' },
  { id: 'p2' as Permission['id'], name: 'roles.update' },
  { id: 'p3' as Permission['id'], name: 'users.view' },
]

describe('useRoles hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrf.mockResolvedValue(undefined)
  })

  it('useRolesTable requests the roles list with the standard table params', async () => {
    mocks.get.mockResolvedValue({ data: rolesPage })

    const { result } = renderHookWithQuery(() => useRolesTable())

    await vi.waitFor(() => expect(result.current.data).toEqual(rolesPage.data))
    expect(mocks.get).toHaveBeenCalledWith('/api/roles', {
      params: { page: 1, per_page: 10 },
    })
    expect(result.current.tableProps.rowCount).toBe(24)
  })

  it('usePermissionCatalogue fetches the full permission list and maps to the array', async () => {
    mocks.get.mockResolvedValue({ data: permissions })

    const { result } = renderHookWithQuery(() => usePermissionCatalogue())

    await vi.waitFor(() => expect(result.current.data).toEqual(permissions))
    expect(mocks.get).toHaveBeenCalledWith('/api/permissions')
  })

  it('useCreateRole POSTs the payload and invalidates the roles caches', async () => {
    mocks.post.mockResolvedValue({ data: rolesPage.data[1] })
    const { result, queryClient } = renderHookWithQuery(() => useCreateRole())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.mutateAsync({ name: 'editor', permissions: ['roles.view'] })

    expect(mocks.ensureCsrf).toHaveBeenCalledOnce()
    expect(mocks.post).toHaveBeenCalledWith('/api/roles', {
      name: 'editor',
      permissions: ['roles.view'],
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'roles', {}] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['roles'] })
  })

  it('useUpdateRole PUTs to the role id with the payload', async () => {
    mocks.put.mockResolvedValue({ data: rolesPage.data[0] })
    const { result, queryClient } = renderHookWithQuery(() => useUpdateRole())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.mutateAsync({
      id: '1',
      payload: { name: 'admin', permissions: ['roles.view', 'roles.update'] },
    })

    expect(mocks.ensureCsrf).toHaveBeenCalledOnce()
    expect(mocks.put).toHaveBeenCalledWith('/api/roles/1', {
      name: 'admin',
      permissions: ['roles.view', 'roles.update'],
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['table', 'roles', {}] })
  })

  it('useDeleteRole DELETEs the role id and invalidates', async () => {
    mocks.delete.mockResolvedValue({ data: null })
    const { result, queryClient } = renderHookWithQuery(() => useDeleteRole())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.mutateAsync('2')

    expect(mocks.ensureCsrf).toHaveBeenCalledOnce()
    expect(mocks.delete).toHaveBeenCalledWith('/api/roles/2')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['roles'] })
  })

  it('isSystemRole flags seeded roles case-insensitively', () => {
    expect(isSystemRole('admin')).toBe(true)
    expect(isSystemRole('Super-Admin')).toBe(true)
    expect(isSystemRole('editor')).toBe(false)
  })
})
