<script setup lang="ts">
import { h, ref } from 'vue'
import { ArrowUpDown, Eye } from 'lucide-vue-next'
import type { Activity } from '@app/types'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { DataTable, type ColumnDef } from '@app/ui/components/data-table'
import { useActivityTable } from '@/features/activity/composables/useActivity'
import { causerLabel, formatActivityDate } from '@/features/activity/lib/format'
import ActivityDetailDialog from '@/features/activity/components/ActivityDetailDialog.vue'

const { data, rowCount, loading, pagination, sorting, globalFilter, columnVisibility } =
  useActivityTable()

const selectedId = ref<number | null>(null)
const detailOpen = ref(false)

function openDetail(id: number) {
  selectedId.value = id
  detailOpen.value = true
}

/** Minimal shape of the header context we touch — avoids a direct `@tanstack/vue-table` dep. */
interface SortableHeaderContext {
  column: {
    getIsSorted: () => false | 'asc' | 'desc'
    toggleSorting: (desc?: boolean) => void
  }
}

/** A clickable header that toggles server-side sorting for a column. */
function sortableHeader(label: string) {
  return ({ column }: SortableHeaderContext) =>
    h(
      Button,
      {
        variant: 'ghost',
        size: 'sm',
        class: '-ml-3 h-8 data-[state=open]:bg-accent',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      () => [label, h(ArrowUpDown, { class: 'ml-1 size-3.5' })],
    )
}

const columns: ColumnDef<Activity>[] = [
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.description),
  },
  {
    accessorKey: 'log_name',
    header: sortableHeader('Event'),
    cell: ({ row }) => {
      const label = row.original.event ?? row.original.log_name
      return label ? h(Badge, { variant: 'secondary' }, () => label) : '—'
    },
  },
  {
    id: 'causer',
    header: 'Causer',
    enableSorting: false,
    cell: ({ row }) => causerLabel(row.original),
  },
  {
    accessorKey: 'created_at',
    header: sortableHeader('Date'),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted-foreground whitespace-nowrap' },
        formatActivityDate(row.original.created_at),
      ),
  },
  {
    id: 'actions',
    header: '',
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) =>
      h(
        Button,
        {
          variant: 'ghost',
          size: 'icon-sm',
          'aria-label': 'View activity detail',
          onClick: () => openDetail(row.original.id),
        },
        () => h(Eye, { class: 'size-4' }),
      ),
  },
]
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">Activity</h1>
      <p class="text-muted-foreground text-sm">A record of actions taken across the application.</p>
    </header>

    <DataTable
      :columns="columns"
      :data="data"
      :row-count="rowCount"
      :loading="loading"
      search-placeholder="Search activity…"
      v-model:pagination="pagination"
      v-model:sorting="sorting"
      v-model:global-filter="globalFilter"
      v-model:column-visibility="columnVisibility"
    >
      <template #empty>
        <span class="text-muted-foreground">No activity has been recorded yet.</span>
      </template>
    </DataTable>

    <ActivityDetailDialog :id="selectedId" v-model:open="detailOpen" />
  </div>
</template>
