import { Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import { Separator } from '@app/ui/components/ui/separator'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { getErrorMessage } from '@/shared/lib/http'
import { useUser } from '@/features/auth/hooks/useAuth'
import { formatMoney } from '../../lib/money'
import { shopPaths } from '../../lib/paths'
import { ProductImage } from '../../storefront/components/ProductImage'
import { useCart } from '../../cart/hooks/useCart'
import { usePlaceOrder } from '../hooks/useCheckout'

export function CheckoutPage() {
  const { cartQuery, items, itemCount, subtotal, isEmpty } = useCart()
  const user = useUser()
  const placeOrder = usePlaceOrder()

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          to={shopPaths.cart}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to cart
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Checkout</h1>
      </div>

      {cartQuery.isPending ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : isEmpty ? (
        // Empty: nothing to check out
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <h2 className="text-lg font-medium">Your cart is empty</h2>
          <p className="text-muted-foreground mt-1 max-w-xs text-sm">
            Add something to your cart before checking out.
          </p>
          <Button className="mt-6" render={<Link to={shopPaths.shop} />} nativeButton={false}>
            Browse the shop
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-8">
            {/* Delivery / account */}
            <div>
              <h2 className="text-sm font-semibold">Delivery</h2>
              <div className="bg-card mt-3 rounded-xl border p-4 text-sm">
                <p className="font-medium">{user?.name}</p>
                <p className="text-muted-foreground mt-0.5">{user?.email}</p>
                <p className="text-muted-foreground mt-2">
                  Your order is linked to this account. You'll get confirmation the moment it's
                  placed.
                </p>
              </div>
            </div>

            {/* Order review */}
            <div>
              <h2 className="text-sm font-semibold">
                Order review{' '}
                <span className="text-muted-foreground font-normal">({itemCount})</span>
              </h2>
              <ul className="divide-border mt-3 divide-y">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0">
                    <ProductImage
                      src={item.product?.image_url}
                      alt={item.product?.name ?? 'Product'}
                      className="size-16 shrink-0 rounded-lg border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">
                        {item.product?.name ?? 'Product'}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatMoney((item.product?.price ?? 0) * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Summary + place order */}
          <aside className="bg-card rounded-2xl border p-6 lg:sticky lg:top-20">
            <h2 className="text-base font-semibold">Summary</h2>
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
              <span className="text-sm font-medium">Total due</span>
              <span className="text-lg font-semibold tabular-nums">{formatMoney(subtotal)}</span>
            </div>

            {placeOrder.isError && (
              <Alert variant="destructive" className="mt-5">
                <AlertTitle>Couldn't place order</AlertTitle>
                <AlertDescription>{getErrorMessage(placeOrder.error)}</AlertDescription>
              </Alert>
            )}

            <Button
              size="lg"
              className="mt-5 w-full active:translate-y-px"
              disabled={placeOrder.isPending}
              onClick={() => placeOrder.mutate()}
            >
              {placeOrder.isPending && <Loader2 className="size-4 animate-spin" />}
              {placeOrder.isPending ? 'Placing order' : 'Place order'}
            </Button>
            <p className="text-muted-foreground mt-3 flex items-center justify-center gap-1.5 text-xs">
              <Lock className="size-3.5" />
              Secure, encrypted checkout
            </p>
          </aside>
        </div>
      )}
    </section>
  )
}
