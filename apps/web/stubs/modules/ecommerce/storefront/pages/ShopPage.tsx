import { useEffect, useRef, useState } from 'react'
import { PackageOpen, Search, ShoppingBag } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import { Input } from '@app/ui/components/ui/input'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { cn } from '@app/ui/lib/utils'
import type { Product } from '../../types'
import { useCart } from '../../cart/hooks/useCart'
import { useCategories, useProducts } from '../hooks/useCatalog'
import { ProductCard } from '../components/ProductCard'

function chipClass(active: boolean) {
  return cn(
    'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
    active
      ? 'bg-primary text-primary-foreground border-primary'
      : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
  )
}

export function ShopPage() {
  // --- Filters (category + debounced search) drive the product query. ---
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isPending, isError, refetch } = useProducts({
    ...(activeCategory ? { category_id: activeCategory } : {}),
    ...(query ? { q: query } : {}),
  })
  const { data: categories } = useCategories()

  const products: Product[] = data?.data ?? []
  const total = data?.meta?.total ?? products.length
  const hasFilters = Boolean(activeCategory) || Boolean(query)

  // --- Add to cart: the page owns the single mutation; cards report their own state. ---
  const { addItem } = useCart()
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(addedTimer.current), [])

  function handleAdd(product: Product) {
    setAddingId(product.id)
    addItem.mutate(
      { product_id: product.id, quantity: 1 },
      {
        onSuccess: () => {
          setAddedId(product.id)
          clearTimeout(addedTimer.current)
          addedTimer.current = setTimeout(
            () => setAddedId((current) => (current === product.id ? null : current)),
            1800,
          )
        },
        onSettled: () => setAddingId((current) => (current === product.id ? null : current)),
      },
    )
  }

  function clearFilters() {
    setActiveCategory(null)
    setSearchInput('')
    setQuery('')
  }

  return (
    <section className="space-y-8">
      {/* Storefront header */}
      <header className="border-border bg-muted/30 relative overflow-hidden rounded-2xl border px-6 py-10 md:px-10 md:py-14">
        <div className="max-w-2xl">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
            New arrivals
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Shop the collection
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed md:text-base">
            Curated goods, honestly priced. Every order ships free and returns are painless within
            30 days.
          </p>
        </div>

        <ShoppingBag
          className="text-muted-foreground/15 pointer-events-none absolute -right-6 -bottom-8 size-44 md:size-56"
          aria-hidden="true"
        />
      </header>

      {/* Controls: search + category filter */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products"
              className="pl-9"
              type="search"
            />
          </div>
          <p className="text-muted-foreground text-sm tabular-nums" aria-live="polite">
            {total} {total === 1 ? 'product' : 'products'}
          </p>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            className={chipClass(activeCategory === null)}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {(categories ?? []).map((category) => (
            <button
              key={category.id}
              type="button"
              className={chipClass(activeCategory === category.id)}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load products</AlertTitle>
          <AlertDescription>
            Something went wrong fetching the catalog.
            <button className="underline underline-offset-4" onClick={() => refetch()}>
              Try again
            </button>
          </AlertDescription>
        </Alert>
      ) : isPending ? (
        // Loading skeletons (match the card shape)
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, n) => (
            <div key={n} className="flex flex-col gap-3">
              <Skeleton className="aspect-[4/5] rounded-xl" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <PackageOpen className="text-muted-foreground/60 size-10" />
          <h2 className="mt-4 text-lg font-medium">No products found</h2>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            {hasFilters
              ? 'Nothing matches these filters yet. Try another category or search.'
              : 'The catalog is empty for now. Check back soon.'}
          </p>
          {hasFilters && (
            <Button variant="outline" size="sm" className="mt-5" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        // Product grid with a staggered CSS entrance (tw-animate-css; skipped under reduced motion).
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500 ease-out motion-reduce:animate-none"
              style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
            >
              <ProductCard
                product={product}
                adding={addingId === product.id}
                added={addedId === product.id}
                onAdd={handleAdd}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
