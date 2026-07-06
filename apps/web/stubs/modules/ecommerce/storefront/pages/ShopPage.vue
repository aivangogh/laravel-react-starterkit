<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { PackageOpen, Search, ShoppingBag } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import { Input } from '@app/ui/components/ui/input'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { cn } from '@app/ui/lib/utils'
import type { Product } from '../../types'
import { useCategories, useProducts } from '../composables/useCatalog'
import { useReveal } from '../composables/useReveal'
import { useCart } from '../../cart/composables/useCart'
import ProductCard from '../components/ProductCard.vue'

// --- Filters (category + debounced search) drive the reactive product query. ---
const activeCategory = ref<string | null>(null)
const searchInput = ref('')
const query = ref('')

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    query.value = value.trim()
  }, 300)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

const params = computed(() => ({
  ...(activeCategory.value ? { category_id: activeCategory.value } : {}),
  ...(query.value ? { q: query.value } : {}),
}))

const { data, isPending, isError, refetch } = useProducts(params)
const { data: categories } = useCategories()

const products = computed<Product[]>(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta?.total ?? products.value.length)
const hasFilters = computed(() => Boolean(activeCategory.value) || Boolean(query.value))

// --- Add to cart: the page owns the single mutation; cards report their own state. ---
const { addItem } = useCart()
const addingId = ref<string | null>(null)
const addedId = ref<string | null>(null)
let addedTimer: ReturnType<typeof setTimeout> | undefined

function handleAdd(product: Product) {
  addingId.value = product.id
  addItem.mutate(
    { product_id: product.id, quantity: 1 },
    {
      onSuccess: () => {
        addedId.value = product.id
        clearTimeout(addedTimer)
        addedTimer = setTimeout(() => {
          if (addedId.value === product.id) addedId.value = null
        }, 1800)
      },
      onSettled: () => {
        if (addingId.value === product.id) addingId.value = null
      },
    },
  )
}
onBeforeUnmount(() => clearTimeout(addedTimer))

function clearFilters() {
  activeCategory.value = null
  searchInput.value = ''
  query.value = ''
}

// --- Staggered reveal for the grid (one observer, per-item transition delay). ---
const { revealed, observe } = useReveal()
</script>

<template>
  <section class="space-y-8">
    <!-- Storefront header -->
    <header
      class="border-border bg-muted/30 relative overflow-hidden rounded-2xl border px-6 py-10 md:px-10 md:py-14"
    >
      <div class="max-w-2xl">
        <p class="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          New arrivals
        </p>
        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          Shop the collection
        </h1>
        <p class="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed md:text-base">
          Curated goods, honestly priced. Every order ships free and returns are painless within 30
          days.
        </p>
      </div>

      <ShoppingBag
        class="text-muted-foreground/15 pointer-events-none absolute -right-6 -bottom-8 size-44 md:size-56"
        aria-hidden="true"
      />
    </header>

    <!-- Controls: search + category filter -->
    <div class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative w-full sm:max-w-xs">
          <Search
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input v-model="searchInput" placeholder="Search products" class="pl-9" type="search" />
        </div>
        <p class="text-muted-foreground text-sm tabular-nums" aria-live="polite">
          {{ total }} {{ total === 1 ? 'product' : 'products' }}
        </p>
      </div>

      <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          :class="
            cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              activeCategory === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
            )
          "
          @click="activeCategory = null"
        >
          All
        </button>
        <button
          v-for="category in categories ?? []"
          :key="category.id"
          type="button"
          :class="
            cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              activeCategory === category.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
            )
          "
          @click="activeCategory = category.id"
        >
          {{ category.name }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <Alert v-if="isError" variant="destructive">
      <AlertTitle>Couldn't load products</AlertTitle>
      <AlertDescription>
        Something went wrong fetching the catalog.
        <button class="underline underline-offset-4" @click="() => refetch()">Try again</button>
      </AlertDescription>
    </Alert>

    <!-- Loading skeletons (match the card shape) -->
    <div
      v-else-if="isPending"
      class="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4"
    >
      <div v-for="n in 8" :key="n" class="flex flex-col gap-3">
        <Skeleton class="aspect-[4/5] rounded-xl" />
        <Skeleton class="h-3 w-16" />
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-20" />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="products.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center"
    >
      <PackageOpen class="text-muted-foreground/60 size-10" />
      <h2 class="mt-4 text-lg font-medium">No products found</h2>
      <p class="text-muted-foreground mt-1 max-w-xs text-sm">
        {{
          hasFilters
            ? 'Nothing matches these filters yet. Try another category or search.'
            : 'The catalog is empty for now. Check back soon.'
        }}
      </p>
      <Button v-if="hasFilters" variant="outline" size="sm" class="mt-5" @click="clearFilters">
        Clear filters
      </Button>
    </div>

    <!-- Product grid -->
    <div
      v-else
      :ref="observe"
      class="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4"
    >
      <div
        v-for="(product, index) in products"
        :key="product.id"
        class="transition-all duration-500 ease-out"
        :class="revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
        :style="{ transitionDelay: `${Math.min(index, 8) * 45}ms` }"
      >
        <ProductCard
          :product="product"
          :adding="addingId === product.id"
          :added="addedId === product.id"
          @add="handleAdd"
        />
      </div>
    </div>
  </section>
</template>
