import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@app/ui/components/ui/alert-dialog'
import { Button } from '@app/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/ui/dialog'
import { Label } from '@app/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@app/ui/components/ui/select'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { getErrorMessage } from '@/shared/lib/http'
import { usePermissions } from '@/shared/hooks/usePermissions'
import type { OrderStatus } from '../../types'
import { formatMoney } from '../../lib/money'
import { useDeleteOrder, useOrderDetail, useUpdateOrderStatus } from '../hooks/useOrders'

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'shipped', 'completed', 'cancelled']

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Back-office order detail. Fetches the single order (with line items) on open, lets an
 * `orders.update` user change its status, and an `orders.delete` user remove it behind an
 * alert-dialog confirm. All writes invalidate the list + detail caches via the hooks. The body is
 * mounted only while open, so the order is fetched only then and transient UI starts fresh.
 */
export function OrderDetailDialog({
  open,
  onOpenChange,
  orderId = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId?: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <OrderDetailDialogBody orderId={orderId} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function OrderDetailDialogBody({
  orderId,
  onClose,
}: {
  orderId: string | null
  onClose: () => void
}) {
  const { can } = usePermissions()
  const orderQuery = useOrderDetail(orderId)
  const order = orderQuery.data ?? null

  // Local editable status; falls back to the fetched order's until the user picks one.
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)
  const status = selectedStatus ?? order?.status ?? null
  const dirty = order != null && status != null && status !== order.status

  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const error = updateStatus.error ?? deleteOrder.error
  const shortId = orderId ? `#${orderId.slice(0, 8)}` : ''

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Order {orderId && <span className="font-mono text-base">{shortId}</span>}
        </DialogTitle>
        <DialogDescription>
          {order
            ? `Placed ${dateFormatter.format(new Date(order.created_at))}`
            : 'Loading order details…'}
        </DialogDescription>
      </DialogHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      {/* Line items */}
      <div className="space-y-3">
        {orderQuery.isLoading
          ? Array.from({ length: 3 }, (_, n) => <Skeleton key={n} className="h-10 w-full" />)
          : order && (
              <>
                <ul className="divide-border divide-y rounded-md border">
                  {(order.items ?? []).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {formatMoney(item.unit_price)} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium tabular-nums">
                        {formatMoney(item.unit_price * item.quantity)}
                      </span>
                    </li>
                  ))}
                  {!(order.items ?? []).length && (
                    <li className="text-muted-foreground px-3 py-4 text-center text-sm">
                      This order has no line items.
                    </li>
                  )}
                </ul>

                <div className="flex items-center justify-between px-1 text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(order.total)}</span>
                </div>
              </>
            )}
      </div>

      {/* Status control */}
      {order && can('orders.update') && (
        <div className="space-y-2">
          <Label htmlFor="order-status">Status</Label>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => value && setSelectedStatus(value as OrderStatus)}
            >
              <SelectTrigger id="order-status" className="flex-1 capitalize">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option} className="capitalize">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!dirty || updateStatus.isPending}
              onClick={() => order && status && updateStatus.mutate({ id: order.id, status })}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        {order && can('orders.delete') ? (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete order
          </Button>
        ) : (
          <span />
        )}
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes{' '}
              {orderId && <span className="text-foreground font-mono font-medium">{shortId}</span>}{' '}
              and its line items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOrder.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteOrder.isPending}
              onClick={() =>
                order &&
                deleteOrder.mutate(order.id, {
                  onSuccess: () => {
                    setConfirmDeleteOpen(false)
                    onClose()
                  },
                })
              }
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
