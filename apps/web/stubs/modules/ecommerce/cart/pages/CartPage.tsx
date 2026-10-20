import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Loader2, ShoppingCart, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import { Separator } from '@app/ui/components/ui/separator'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { cn } from '@app/ui/lib/utils'
import type { CartItem } from '../../types'
import { formatMoney } from '../../lib/money'
import { shopPaths } from '../../lib/paths'
import { ProductImage } from '../../storefront/components/ProductImage'
import { QuantityStepper } from '../../storefront/components/QuantityStepper'
import { useCart } from '../hooks/useCart'

function lineTotal(item: CartItem): number {
  return (item.product?.price ?? 0) * item.quantity
}

export function CartPage() {
  const { cartQuery, items, itemCount, subtotal, isEmpty, updateItem, removeItem, clearCart } =
    useCart()

  // Track the single line currently mutating so we only disable that row's controls.
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  function changeQuantity(item: CartItem, quantity: number) {
    setMutatingId(item.id)
    updateItem.mutate({ id: item.id, quantity }, { onSettled: () => setMutatingId(null) })
  }

  function remove(item: CartItem) {
    setMutatingId(item.id)
    removeItem.mutate(item.id, { onSettled: () => setMutatingId(null) })
  }

  return (
    <section className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {itemCount > 0
              ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready to check out.`
              : 'Review your items before checkout.'}
          </p>
        </div>
        {!isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={clearCart.isPending}
            onClick={() => clearCart.mutate()}
          >
            Clear cart
          </Button>
        )}
      </header>

      {cartQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load your cart</AlertTitle>
          <AlertDescription>
            <button className="underline underline-offset-4" onClick={() => cartQuery.refetch()}>
              Try again
            </button>
          </AlertDescription>
        </Alert>
      ) : cartQuery.isPending ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            {Array.from({ length: 3 }, (_, n) => (
              <div key={n} className="flex gap-4">
                <Skeleton className="size-20 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <ShoppingCart className="text-muted-foreground/60 size-10" />
          <h2 className="mt-4 text-lg font-medium">Your cart is empty</h2>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            Browse the collection and add something you love.
          </p>
          <Button className="mt-6" render={<Link to={shopPaths.shop} />} nativeButton={false}>
            Start shopping
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_20rem]">
          <ul className="divide-border divide-y">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn('flex gap-4 py-5 first:pt-0', mutatingId === item.id && 'opacity-60')}
              >
                <Link to={shopPaths.product(item.product_id)} className="shrink-0">
                  <ProductImage
                    src={item.product?.image_url}
                    alt={item.product?.name ?? 'Product'}
                    className="size-20 rounded-lg border sm:size-24"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={shopPaths.product(item.product_id)}
                        className="hover:text-muted-foreground line-clamp-1 text-sm font-medium transition-colors"
                      >
                        {item.product?.name ?? 'Product'}
                      </Link>
                      {item.product && (
                        <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">
                          {formatMoney(item.product.price)} each
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(lineTotal(item))}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3">
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      max={item.product?.stock || undefined}
                      disabled={mutatingId === item.id}
                      label={item.product?.name}
                      onChange={(quantity) => changeQuantity(item, quantity)}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
                      disabled={mutatingId === item.id}
                      onClick={() => remove(item)}
                    >
                      {mutatingId === item.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Order summary */}
          <aside className="bg-card rounded-2xl border p-6 lg:sticky lg:top-20">
            <h2 className="text-base font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="text-muted-foreground">Free</dd>
              </div>
            </dl>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            <Button
              size="lg"
              className="mt-6 w-full"
              render={<Link to={shopPaths.checkout} />}
              nativeButton={false}
            >
              Proceed to checkout
              <ArrowRight className="size-4" />
            </Button>
            <Link
              to={shopPaths.shop}
              className="text-muted-foreground hover:text-foreground mt-4 block text-center text-sm transition-colors"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </section>
  )
}
