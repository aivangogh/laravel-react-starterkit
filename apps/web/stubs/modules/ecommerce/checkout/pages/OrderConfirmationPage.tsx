import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { Separator } from '@app/ui/components/ui/separator'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import type { OrderStatus } from '../../types'
import { formatMoney } from '../../lib/money'
import { shopPaths } from '../../lib/paths'
import { useOrder } from '../hooks/useCheckout'

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' })

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  paid: 'default',
  shipped: 'default',
  completed: 'default',
  cancelled: 'destructive',
}

export function OrderConfirmationPage({ id }: { id: string }) {
  const { data: order, isPending, isError, refetch } = useOrder(id)

  /** Short, human-friendly reference derived from the order UUID. */
  const orderRef = order ? `#${order.id.slice(0, 8).toUpperCase()}` : ''

  return (
    <section className="mx-auto max-w-2xl">
      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load your order</AlertTitle>
          <AlertDescription>
            <button className="underline underline-offset-4" onClick={() => refetch()}>
              Try again
            </button>
          </AlertDescription>
        </Alert>
      ) : isPending ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 py-8">
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center text-center duration-500 ease-out">
            <div className="bg-primary text-primary-foreground grid size-14 place-items-center rounded-full">
              <Check className="size-7" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">Order confirmed</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Thank you. Your order <span className="text-foreground font-medium">{orderRef}</span>{' '}
              is in. A confirmation is on its way.
            </p>
          </div>

          <div className="bg-card rounded-2xl border">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Order</p>
                <p className="mt-0.5 font-medium tabular-nums">{orderRef}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Placed</p>
                <p className="mt-0.5 text-sm">{dateFormatter.format(new Date(order.created_at))}</p>
              </div>
              <Badge variant={statusVariant[order.status]} className="capitalize">
                {order.status}
              </Badge>
            </div>

            <Separator />

            <ul className="divide-border divide-y px-6">
              {(order.items ?? []).map((line) => (
                <li key={line.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">{line.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">
                      {formatMoney(line.unit_price)} &times; {line.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatMoney(line.unit_price * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <Separator />

            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">{formatMoney(order.total)}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <Button size="lg" render={<Link to={shopPaths.shop} />} nativeButton={false}>
              Continue shopping
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
