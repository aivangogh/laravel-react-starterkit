import type { MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { Paginated, Role, User } from '@app/types'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { roleKeys, tableKeys, userKeys } from '@/shared/lib/query-keys'
import { useServerTable } from '@/shared/composables/useServerTable'

/**
 * Users feature server-state. Every call goes through the shared `http` client (never raw axios)
 * and TanStack Query owns the cache — the components stay presentational.
 *
 * Endpoints (see the issue #20 contract): the SPA's `http` base URL has no `/api` prefix, so the
 * paths are spelled out in full here, matching the auth store's `/api/user`.
 */
const USERS_RESOURCE = 'users'
const USERS_ENDPOINT = '/api/users'
const ROLES_ENDPOINT = '/api/roles'

/** Create payload — `password` is required; `roles` is a list of role *names* (`exists:roles,name`). */
export interface CreateUserPayload {
  name: string
  email: string
  password: string
  roles: string[]
}

/** Update payload — `password` is optional ("leave blank to keep"); everything else mirrors create. */
export interface UpdateUserPayload {
  id: string
  name: string
  email: string
  password?: string
  roles: string[]
}

/**
 * The server-driven users list. Thin wrapper over the shared `useServerTable`, which standardises
 * the `page`/`per_page`/`sort`/`dir`/`q` contract every index endpoint reads. Bind the returned
 * refs straight into `<DataTable>`.
 */
export function useUsersTable() {
  return useServerTable<User>({ resource: USERS_RESOURCE, endpoint: USERS_ENDPOINT })
}

/**
 * Role catalogue for the assignment picker. Fetched once and cached under `roleKeys.list()`.
 * `enabled` lets a dialog defer the request until it is actually opened.
 */
export function useRoleOptions(enabled?: MaybeRefOrGetter<boolean>) {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: async () => {
      const { data } = await http.get<Paginated<Role>>(ROLES_ENDPOINT, {
        params: { per_page: 100 },
      })
      return data.data
    },
    enabled,
  })
}

/**
 * Invalidate every cached view of the users resource after a write: the server-driven table pages
 * (all param variants, matched by prefix) and the `userKeys` list/detail caches.
 */
function useInvalidateUsers() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tableKeys.list(USERS_RESOURCE) }),
      queryClient.invalidateQueries({ queryKey: userKeys.all }),
    ])
}

/** Create a user (`POST /api/users` → 201 User). Invalidates the list on success. */
export function useCreateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<User>(USERS_ENDPOINT, payload)
      return data
    },
    onSuccess: invalidate,
  })
}

/** Update a user (`PUT /api/users/{id}` → User). Omits `password` when left blank. */
export function useUpdateUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateUserPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.put<User>(`${USERS_ENDPOINT}/${id}`, payload)
      return data
    },
    onSuccess: invalidate,
  })
}

/** Delete a user (`DELETE /api/users/{id}` → 204). Invalidates the list on success. */
export function useDeleteUser() {
  const invalidate = useInvalidateUsers()
  return useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie()
      await http.delete(`${USERS_ENDPOINT}/${id}`)
    },
    onSuccess: invalidate,
  })
}
