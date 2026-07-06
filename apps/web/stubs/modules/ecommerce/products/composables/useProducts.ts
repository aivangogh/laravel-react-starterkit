import type { MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ensureCsrfCookie, http } from '@/shared/lib/http'
import { categoryKeys, productKeys, tableKeys } from '@/shared/lib/query-keys'
import { useServerTable } from '@/shared/composables/useServerTable'
import type { Category, Paginated, Product } from '../../types'

/**
 * Products (catalog) feature server-state. Every call goes through the shared `http` client (never
 * raw axios) and TanStack Query owns the cache — the components stay presentational. The SPA's
 * `http` base URL has no `/api` prefix, so the paths are spelled out in full here.
 *
 * Money note: `price` is carried in INTEGER MINOR units (cents) end-to-end; the form converts to/
 * from major units at its edges (see `../lib/money`), so payloads here are always minor units.
 */
const PRODUCTS_RESOURCE = 'products'
const PRODUCTS_ENDPOINT = '/api/products'
const CATEGORIES_ENDPOINT = '/api/categories'

/** Create payload. `price` is in integer minor units (cents); `category_id` is a category UUID. */
export interface CreateProductPayload {
  name: string
  price: number
  category_id: string
  description: string | null
  stock: number
  is_active: boolean
}

/** Update payload — mirrors create plus the target `id`. */
export interface UpdateProductPayload extends CreateProductPayload {
  id: string
}

/**
 * The server-driven products list. Thin wrapper over the shared `useServerTable`, which
 * standardises the `page`/`per_page`/`sort`/`dir`/`q` contract every index endpoint reads. Bind the
 * returned refs straight into `<DataTable>`.
 */
export function useProductsTable() {
  return useServerTable<Product>({ resource: PRODUCTS_RESOURCE, endpoint: PRODUCTS_ENDPOINT })
}

/**
 * Category catalogue for the product form's category picker. Fetched once and cached under
 * `categoryKeys.list()`. `enabled` lets the dialog defer the request until it is actually opened.
 */
export function useCategoryOptions(enabled?: MaybeRefOrGetter<boolean>) {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const { data } = await http.get<Paginated<Category>>(CATEGORIES_ENDPOINT, {
        params: { per_page: 100 },
      })
      return data.data
    },
    enabled,
  })
}

/**
 * Invalidate every cached view of the products resource after a write: the server-driven table
 * pages (all param variants, matched by prefix) and the `productKeys` list/detail caches.
 */
function useInvalidateProducts() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: tableKeys.list(PRODUCTS_RESOURCE) }),
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
    ])
}

/** Create a product (`POST /api/products` → 201 Product). Invalidates the list on success. */
export function useCreateProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.post<Product>(PRODUCTS_ENDPOINT, payload)
      return data
    },
    onSuccess: invalidate,
  })
}

/** Update a product (`PUT /api/products/{id}` → Product). Invalidates the list on success. */
export function useUpdateProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateProductPayload) => {
      await ensureCsrfCookie()
      const { data } = await http.put<Product>(`${PRODUCTS_ENDPOINT}/${id}`, payload)
      return data
    },
    onSuccess: invalidate,
  })
}

/** Delete a product (`DELETE /api/products/{id}` → 204). Invalidates the list on success. */
export function useDeleteProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: async (id: string) => {
      await ensureCsrfCookie()
      await http.delete(`${PRODUCTS_ENDPOINT}/${id}`)
    },
    onSuccess: invalidate,
  })
}
