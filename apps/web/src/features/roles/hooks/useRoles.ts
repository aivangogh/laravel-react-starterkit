import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { IsoDateTime, Permission, Role } from '@app/types'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { permissionKeys, roleKeys, tableKeys } from '@/shared/lib/query-keys'
import { useServerTable } from '@/shared/hooks/useServerTable'

/**
 * TanStack Query hooks for the roles/permissions feature. Every server read/write goes through
 * `http` here — components never touch axios directly. Writes prime the CSRF cookie (Sanctum) and
 * invalidate the roles table + role caches on success so the list stays fresh.
 */

/** The `Role` shape as it comes back from the list endpoint, widened with the sortable `created_at`. */
export type RoleRow = Role & { created_at?: IsoDateTime }

/** Payload for create/update — mirrors the `roles` store/update validation (name + permission names). */
export interface RolePayload {
  name: string
  permissions: string[]
}

/** Variables for an update: the target id plus the new payload. */
export interface UpdateRoleVariables {
  id: string
  payload: RolePayload
}

/**
 * Seeded roles that back the app's authorization and must never be deleted from the UI. The list
 * still lets you view/edit them; only the destructive action is withheld (see `RoleRowActions`).
 */
export const SYSTEM_ROLES = ['super-admin', 'admin'] as const

/** True when a role is one of the protected {@link SYSTEM_ROLES} (case-insensitive). */
export function isSystemRole(name: string): boolean {
  return (SYSTEM_ROLES as readonly string[]).includes(name.toLowerCase())
}

/** Invalidate every cached roles list (paged table + role keys) after a write. */
function useInvalidateRoles() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tableKeys.list('roles') }),
      queryClient.invalidateQueries({ queryKey: roleKeys.all }),
    ])
}

/**
 * Server-driven roles table. Delegates to the shared {@link useServerTable}, which owns the
 * page/per_page/sort/dir/q contract; here we only bind the `roles` resource + endpoint.
 */
export function useRolesTable() {
  return useServerTable<RoleRow>({ resource: 'roles', endpoint: '/api/roles' })
}

/**
 * Read-only permission catalogue for the assignment UI. Fetches the full list in one page so the
 * matrix can render every group; cached under `permissionKeys.lists()` and shared across dialogs.
 */
export function usePermissionCatalogue() {
  return useQuery({
    queryKey: permissionKeys.lists(),
    queryFn: async () => {
      // Unpaginated + `JsonResource::withoutWrapping()` on the backend → a bare `Permission[]`.
      const { data } = await http.get<Permission[]>('/api/permissions')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** Create a role. Returns the created `Role`; invalidates the roles caches on success. */
export function useCreateRole() {
  const invalidate = useInvalidateRoles()
  return useMutation({
    mutationFn: async (payload: RolePayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<Role>('/api/roles', payload)
      return data
    },
    onSuccess: invalidate,
  })
}

/** Update a role's name/permissions. Invalidates the roles caches on success. */
export function useUpdateRole() {
  const invalidate = useInvalidateRoles()
  return useMutation({
    mutationFn: async ({ id, payload }: UpdateRoleVariables) => {
      await ensureCsrfCookie()
      const { data } = await http.put<Role>(`/api/roles/${id}`, payload)
      return data
    },
    onSuccess: invalidate,
  })
}

/** Delete a role by id. Invalidates the roles caches on success. */
export function useDeleteRole() {
  const invalidate = useInvalidateRoles()
  return useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie()
      await http.delete(`/api/roles/${id}`)
    },
    onSuccess: invalidate,
  })
}
