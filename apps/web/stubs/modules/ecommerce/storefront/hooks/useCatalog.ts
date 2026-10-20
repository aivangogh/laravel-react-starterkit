import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/lib/http'
import { categoryKeys, productKeys } from '@/shared/lib/query-keys'
import type { Category, Paginated, Product } from '../../types'

/**
 * Catalog server-state (read-only). Products and categories are public catalog
 * data, so these are plain `useQuery` reads through the shared `http` client —
 * TanStack Query owns the cache, the pages stay presentational. Prices arrive in
 * minor units; format at the edge with `formatMoney`.
 */

const PRODUCTS_ENDPOINT = '/api/products'
const CATEGORIES_ENDPOINT = '/api/categories'

/** Query params for the product grid. All optional; the server ignores what it doesn't use. */
export interface ProductListParams {
  /** Filter to a single category. */
  category_id?: string
  /** Free-text search across name/description. */
  q?: string
  page?: number
  per_page?: number
}

/**
 * Paginated product list for the shop grid. Changing the category filter or search term
 * re-keys the cache and refetches.
 */
export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await http.get<Paginated<Product>>(PRODUCTS_ENDPOINT, { params })
      return data
    },
  })
}

/** A single product for the detail page. Disabled until an id is present. */
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await http.get<Product>(`${PRODUCTS_ENDPOINT}/${id}`)
      return data
    },
    enabled: Boolean(id),
  })
}

/** The category catalogue, for the shop's filter rail. Fetched once and cached. */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const { data } = await http.get<Paginated<Category>>(CATEGORIES_ENDPOINT, {
        params: { per_page: 100 },
      })
      return data.data
    },
  })
}
