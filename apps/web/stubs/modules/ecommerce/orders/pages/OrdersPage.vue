<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { ArrowUpDown, Eye } from 'lucide-vue-next'
import { DataTable, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { cn } from '@app/ui/lib/utils'
import type { Order, OrderStatus } from '../../types'
import { formatMoney } from '../lib/money'
import { useOrdersTable } from '../composables/useOrders'
import OrderDetailDialog from '../components/OrderDetailDialog.vue'

const { data, rowCount, loading, pagination, sorting, globalFilter, columnVisibility } =
  useOrdersTable()

// One detail dialog, targeted at the row the user opens.
const detailOpen = ref(false)
const activeOrderId = ref<string | null>(null)

function openDetail(order: Order): void {
  activeOrderId.value = order.id
  detailOpen.value = true
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

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

/** Just enough of the TanStack column API to render a sort toggle (avoids importing the whole type). */
interface SortableColumn {
  toggleSorting: (desc?: boolean) => void
  getIsSorted: () => false | 'asc' | 'desc'
}

/** A header that toggles the column's server-side sort via a ghost button. */
function sortableHeader(label: string) {
  return ({ column }: { column: SortableColumn }) =>
    h(
      Button,
      {
        variant: 'ghost',
        size: 'sm',
        class: '-ml-3 h-8',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      () => [label, h(ArrowUpDown, { class: 'ml-2 size-3.5' })],
    )
}

const columns = computed<ColumnDef<Order>[]>(() => [
  {
    accessorKey: 'id',
    header: sortableHeader('Order'),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs' }, `#${row.original.id.slice(0, 8)}`),
  },
  {
    accessorKey: 'status',
    header: sortableHeader('Status'),
    cell: ({ row }) =>
      h(
        Badge,
        { variant: 'outline', class: cn('capitalize', STATUS_BADGE[row.original.status]) },
        () => row.original.status,
      ),
  },
  {
    accessorKey: 'total',
    header: sortableHeader('Total'),
    cell: ({ row }) =>
      h('span', { class: 'font-medium tabular-nums' }, formatMoney(row.original.total)),
  },
  {
    id: 'items',
    header: 'Items',
    enableSorting: false,
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground tabular-nums' }, row.original.items?.length ?? 0),
  },
  {
    accessorKey: 'created_at',
    header: sortableHeader('Placed'),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted-foreground whitespace-nowrap' },
        dateFormatter.format(new Date(row.original.created_at)),
      ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            class: 'h-8',
            'aria-label': 'View order',
            onClick: () => openDetail(row.original),
          },
          () => [h(Eye, { class: 'size-4' }), 'View'],
        ),
      ]),
  },
])
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Orders</h1>
      <p class="text-muted-foreground text-sm">
        Review placed orders, update their status, and remove cancelled records.
      </p>
    </header>

    <DataTable
      v-model:pagination="pagination"
      v-model:sorting="sorting"
      v-model:global-filter="globalFilter"
      v-model:column-visibility="columnVisibility"
      :columns="columns"
      :data="data"
      :row-count="rowCount"
      :loading="loading"
      search-placeholder="Search orders..."
    />

    <OrderDetailDialog v-model:open="detailOpen" :order-id="activeOrderId" />
  </section>
</template>
