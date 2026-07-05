<script setup lang="ts">
import { h } from 'vue'
import { ArrowUpDown } from 'lucide-vue-next'
import type { ApiToken } from '@app/types'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { DataTable } from '@app/ui/components/data-table'
import type { ColumnDef } from '@app/ui/components/data-table'
import { useTokens } from '@/features/tokens/composables/useTokens'
import CreateTokenDialog from '@/features/tokens/components/CreateTokenDialog.vue'
import RevokeTokenButton from '@/features/tokens/components/RevokeTokenButton.vue'

const {
  pagination,
  sorting,
  globalFilter,
  columnVisibility,
  rowSelection,
  data,
  rowCount,
  loading,
  revokeMutation,
} = useTokens()

// One formatter for every date column; nulls render as "Never".
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
function formatDate(value: string | null): string {
  return value ? dateFormat.format(new Date(value)) : 'Never'
}

/** Minimal structural shape of the sortable column API we drive from the header button. */
interface SortableColumn {
  toggleSorting: (desc?: boolean) => void
  getIsSorted: () => false | 'asc' | 'desc'
}

/** A header that toggles server-side sorting for its column (the DataTable renders it verbatim). */
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
      () => [label, h(ArrowUpDown, { class: 'ml-2 size-4' })],
    )
}

const columns: ColumnDef<ApiToken>[] = [
  {
    accessorKey: 'name',
    header: sortableHeader('Name'),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'abilities',
    header: 'Abilities',
    enableSorting: false,
    cell: ({ row }) => {
      const abilities = row.original.abilities
      if (!abilities.length) return h('span', { class: 'text-muted-foreground' }, '—')
      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        abilities.map((ability) =>
          h(Badge, { key: ability, variant: 'secondary' }, () =>
            ability === '*' ? 'all' : ability,
          ),
        ),
      )
    },
  },
  {
    accessorKey: 'last_used_at',
    header: sortableHeader('Last used'),
    cell: ({ row }) => formatDate(row.original.last_used_at),
  },
  {
    accessorKey: 'expires_at',
    header: 'Expires',
    enableSorting: false,
    cell: ({ row }) => formatDate(row.original.expires_at),
  },
  {
    accessorKey: 'created_at',
    header: sortableHeader('Created'),
    cell: ({ row }) => formatDate(row.original.created_at),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) =>
      h('div', { class: 'text-right' }, [
        h(RevokeTokenButton, {
          token: row.original,
          confirm: (id: number) => revokeMutation.mutateAsync(id),
        }),
      ]),
  },
]
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">API Tokens</h1>
      <p class="text-muted-foreground text-sm">
        Personal access tokens authenticate API requests on your behalf.
      </p>
    </div>

    <DataTable
      :columns="columns"
      :data="data"
      :row-count="rowCount"
      :loading="loading"
      search-placeholder="Search tokens..."
      v-model:pagination="pagination"
      v-model:sorting="sorting"
      v-model:global-filter="globalFilter"
      v-model:column-visibility="columnVisibility"
      v-model:row-selection="rowSelection"
    >
      <template #toolbar>
        <CreateTokenDialog />
      </template>

      <template #empty>
        <span class="text-muted-foreground">You haven't created any API tokens yet.</span>
      </template>
    </DataTable>
  </div>
</template>
