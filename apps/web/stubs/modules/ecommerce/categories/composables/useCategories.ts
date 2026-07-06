import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { categoryKeys, tableKeys } from '@/shared/lib/query-keys'
import { useServerTable } from '@/shared/composables/useServerTable'
import type { Category } from '../../types'

/**
 * Categories (catalog) feature server-state. Every call goes through the shared `http` client
 * (never raw axios) and TanStack Query owns the cache — the components stay presentational. The
 * SPA's `http` base URL has no `/api` prefix, so the paths are spelled out in full here.
 */
const CATEGORIES_RESOURCE = 'categories'
const CATEGORIES_ENDPOINT = '/api/categories'

/** Create payload. The slug is derived server-side from `name`. */
export interface CreateCategoryPayload {
  name: string
  description: string | null
}

/** Update payload — mirrors create plus the target `id`. */
export interface UpdateCategoryPayload extends CreateCategoryPayload {
  id: string
}

/**
 * The server-driven categories list. Thin wrapper over the shared `useServerTable`, which
 * standardises the `page`/`per_page`/`sort`/`dir`/`q` contract every index endpoint reads. Bind the
 * returned refs straight into `<DataTable>`.
 */
export function useCategoriesTable() {
  return useServerTable<Category>({ resource: CATEGORIES_RESOURCE, endpoint: CATEGORIES_ENDPOINT })
}

/**
 * Invalidate every cached view of the categories resource after a write: the server-driven table
 * pages (all param variants, matched by prefix) and the `categoryKeys` caches — the latter also
 * feeds the product form's category picker, so it refreshes too.
 */
function useInvalidateCategories() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tableKeys.list(CATEGORIES_RESOURCE) }),
      queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
    ])
}

/** Create a category (`POST /api/categories` → 201 Category). Invalidates the list on success. */
export function useCreateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<Category>(CATEGORIES_ENDPOINT, payload)
      return data
    },
    onSuccess: invalidate,
  })
}

/** Update a category (`PUT /api/categories/{id}` → Category). Invalidates the list on success. */
export function useUpdateCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateCategoryPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.put<Category>(`${CATEGORIES_ENDPOINT}/${id}`, payload)
      return data
    },
    onSuccess: invalidate,
  })
}

/** Delete a category (`DELETE /api/categories/{id}` → 204). Invalidates the list on success. */
export function useDeleteCategory() {
  const invalidate = useInvalidateCategories()
  return useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie()
      await http.delete(`${CATEGORIES_ENDPOINT}/${id}`)
    },
    onSuccess: invalidate,
  })
}
