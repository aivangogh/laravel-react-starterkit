import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Loader2, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { Separator } from '@app/ui/components/ui/separator'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { formatMoney } from '../../lib/money'
import { shopPaths } from '../../lib/paths'
import { useCart } from '../../cart/hooks/useCart'
import { useProduct } from '../hooks/useCatalog'
import { ProductImage } from '../components/ProductImage'
import { QuantityStepper } from '../components/QuantityStepper'

const trust = [
  { icon: Truck, label: 'Free shipping on every order' },
  { icon: RotateCcw, label: '30-day painless returns' },
  { icon: ShieldCheck, label: 'Secure checkout' },
]

export function ProductDetailPage({ id }: { id: string }) {
  const { data: product, isPending, isError, refetch } = useProduct(id)

  // The route keys this page on `id`, so the chosen quantity resets for each product.
  const [quantity, setQuantity] = useState(1)

  const stock = product?.stock ?? 0
  const inStock = stock > 0
  const lowStock = stock > 0 && stock <= 5

  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(addedTimer.current), [])

  function addToCart() {
    if (!product) return
    addItem.mutate(
      { product_id: product.id, quantity },
      {
        onSuccess: () => {
          setAdded(true)
          clearTimeout(addedTimer.current)
          addedTimer.current = setTimeout(() => setAdded(false), 2500)
        },
      },
    )
  }

  return (
    <section className="space-y-6">
      <Link
        to={shopPaths.shop}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to shop
      </Link>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load this product</AlertTitle>
          <AlertDescription>
            It may have been removed.
            <button className="underline underline-offset-4" onClick={() => refetch()}>
              Try again
            </button>
          </AlertDescription>
        </Alert>
      ) : isPending ? (
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4 py-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-full max-w-xs" />
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <ProductImage
              src={product.image_url}
              alt={product.name}
              large
              className="aspect-square w-full rounded-2xl border"
            />
          </div>

          <div className="flex flex-col">
            {product.category && (
              <p className="text-muted-foreground text-sm">{product.category.name}</p>
            )}
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-semibold tabular-nums">
                {formatMoney(product.price)}
              </span>
              {!inStock ? (
                <Badge variant="secondary">Sold out</Badge>
              ) : (
                lowStock && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Only {product.stock} left
                  </Badge>
                )
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground mt-6 max-w-prose text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            )}

            <Separator className="my-7" />

            <div className="flex flex-wrap items-center gap-3">
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={product.stock || 1}
                disabled={!inStock}
                label={product.name}
              />
              <Button
                size="lg"
                className="min-w-44 flex-1 active:translate-y-px sm:flex-none"
                disabled={!inStock || addItem.isPending}
                onClick={addToCart}
              >
                {addItem.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Adding
                  </>
                ) : added ? (
                  <>
                    <Check className="size-4" />
                    Added to cart
                  </>
                ) : inStock ? (
                  'Add to cart'
                ) : (
                  'Sold out'
                )}
              </Button>
            </div>

            {added && (
              <Link
                to={shopPaths.cart}
                className="text-muted-foreground hover:text-foreground animate-in fade-in mt-3 inline-block text-sm underline underline-offset-4 duration-300"
              >
                View cart
              </Link>
            )}

            <ul className="text-muted-foreground mt-8 grid gap-2.5 text-sm">
              {trust.map((point) => (
                <li key={point.label} className="flex items-center gap-2.5">
                  <point.icon className="size-4 shrink-0" />
                  {point.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
