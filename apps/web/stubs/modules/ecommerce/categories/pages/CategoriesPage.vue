<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { ArrowUpDown, Plus } from 'lucide-vue-next'
import { DataTable, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { useCategoriesTable } from '../composables/useCategories'
import CategoryRowActions from '../components/CategoryRowActions.vue'
import CategoryFormDialog from '../components/CategoryFormDialog.vue'
import DeleteCategoryDialog from '../components/DeleteCategoryDialog.vue'
import type { Category } from '../../types'

const { data, rowCount, loading, pagination, sorting, globalFilter, columnVisibility } =
  useCategoriesTable()

// One create/edit dialog and one delete dialog, targeted at the selected row.
const formOpen = ref(false)
const editingCategory = ref<Category | null>(null)
const deleteOpen = ref(false)
const deletingCategory = ref<Category | null>(null)

function openCreate(): void {
  editingCategory.value = null
  formOpen.value = true
}
function openEdit(category: Category): void {
  editingCategory.value = category
  formOpen.value = true
}
function openDelete(category: Category): void {
  deletingCategory.value = category
  deleteOpen.value = true
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

const columns = computed<ColumnDef<Category>[]>(() => [
  {
    accessorKey: 'name',
    header: sortableHeader('Name'),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'slug',
    header: sortableHeader('Slug'),
    cell: ({ row }) =>
      h(Badge, { variant: 'secondary', class: 'font-mono' }, () => row.original.slug),
  },
  {
    id: 'description',
    header: 'Description',
    enableSorting: false,
    cell: ({ row }) => {
      const description = row.original.description
      return description
        ? h('span', { class: 'text-muted-foreground line-clamp-1 max-w-md' }, description)
        : h('span', { class: 'text-muted-foreground' }, '—')
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end' }, [
        h(CategoryRowActions, {
          category: row.original,
          onEdit: () => openEdit(row.original),
          onDelete: () => openDelete(row.original),
        }),
      ]),
  },
])
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Categories</h1>
      <p class="text-muted-foreground text-sm">Organize the catalog into product categories.</p>
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
      search-placeholder="Search categories..."
    >
      <template #toolbar>
        <Button v-can="'catalog.create'" size="sm" @click="openCreate">
          <Plus class="size-4" />
          New category
        </Button>
      </template>
    </DataTable>

    <CategoryFormDialog v-model:open="formOpen" :category="editingCategory" />
    <DeleteCategoryDialog v-model:open="deleteOpen" :category="deletingCategory" />
  </section>
</template>
