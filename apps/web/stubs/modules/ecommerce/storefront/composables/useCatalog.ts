import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { http } from '@/shared/lib/http'
import { categoryKeys, productKeys } from '@/shared/lib/query-keys'
import type { Category, Paginated, Product } from '../../types'

/**
 * Catalog server-state (read-only). Products and categories are public catalog
 * data, so these are plain `useQuery` reads through the shared `http` client —
 * TanStack Query owns the cache, the pages stay presentational. Prices arrive in
 * minor units; format at the edge with `formatPrice`.
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
 * Paginated product list for the shop grid. `params` may be reactive (ref/getter) so
 * changing the category filter or search term re-keys the cache and refetches.
 */
export function useProducts(params?: MaybeRefOrGetter<ProductListParams>) {
  const resolved = computed(() => toValue(params) ?? {})
  return useQuery({
    queryKey: computed(() => productKeys.list(resolved.value as Record<string, unknown>)),
    queryFn: async () => {
      const { data } = await http.get<Paginated<Product>>(PRODUCTS_ENDPOINT, {
        params: resolved.value,
      })
      return data
    },
  })
}

/** A single product for the detail page. Disabled until an id is present. */
export function useProduct(id: MaybeRefOrGetter<string | undefined>) {
  const productId = computed(() => toValue(id))
  return useQuery({
    queryKey: computed(() => productKeys.detail(productId.value ?? '')),
    queryFn: async () => {
      const { data } = await http.get<Product>(`${PRODUCTS_ENDPOINT}/${productId.value}`)
      return data
    },
    enabled: computed(() => Boolean(productId.value)),
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
