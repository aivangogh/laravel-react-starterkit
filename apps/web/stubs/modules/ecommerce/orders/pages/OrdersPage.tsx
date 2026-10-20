import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { DataTable, DataTableSortHeader, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { cn } from '@app/ui/lib/utils'
import type { Order, OrderStatus } from '../../types'
import { formatMoney } from '../../lib/money'
import { useOrdersTable } from '../hooks/useOrders'
import { OrderDetailDialog } from '../components/OrderDetailDialog'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Per-status badge tints. There is no design token for a "shipped" or "completed" hue, so status
 * colour maps to semantic palette utilities (kept dark-mode aware) rather than a neutral token.
 */
const STATUS_BADGE: Record<OrderStatus, string> = {
  pending:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  paid: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  shipped:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
  completed:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
}

export function OrdersPage() {
  const { data, tableProps } = useOrdersTable()

  // One detail dialog, targeted at the row the user opens.
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableSortHeader column={column} label="Order" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs">#{row.original.id.slice(0, 8)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableSortHeader column={column} label="Status" />,
        cell: ({ row }) => (
          <Badge variant="outline" className={cn('capitalize', STATUS_BADGE[row.original.status])}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'total',
        header: ({ column }) => <DataTableSortHeader column={column} label="Total" />,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{formatMoney(row.original.total)}</span>
        ),
      },
      {
        id: 'items',
        header: 'Items',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.original.items?.length ?? 0}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableSortHeader column={column} label="Placed" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {dateFormatter.format(new Date(row.original.created_at))}
          </span>
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              aria-label="View order"
              onClick={() => {
                setActiveOrderId(row.original.id)
                setDetailOpen(true)
              }}
            >
              <Eye className="size-4" />
              View
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm">
          Review placed orders, update their status, and remove cancelled records.
        </p>
      </header>

      <DataTable
        columns={columns}
        data={data}
        {...tableProps}
        searchPlaceholder="Search orders..."
      />

      <OrderDetailDialog open={detailOpen} onOpenChange={setDetailOpen} orderId={activeOrderId} />
    </section>
  )
}
