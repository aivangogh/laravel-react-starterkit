<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { ArrowUpDown, ImageOff, Plus } from 'lucide-vue-next'
import { DataTable, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { useProductsTable } from '../composables/useProducts'
import { formatMinorToMajor } from '../lib/money'
import ProductRowActions from '../components/ProductRowActions.vue'
import ProductFormDialog from '../components/ProductFormDialog.vue'
import DeleteProductDialog from '../components/DeleteProductDialog.vue'
import type { Product } from '../../types'

const { data, rowCount, loading, pagination, sorting, globalFilter, columnVisibility } =
  useProductsTable()

// One create/edit dialog and one delete dialog, targeted at the selected row.
const formOpen = ref(false)
const editingProduct = ref<Product | null>(null)
const deleteOpen = ref(false)
const deletingProduct = ref<Product | null>(null)

function openCreate(): void {
  editingProduct.value = null
  formOpen.value = true
}
function openEdit(product: Product): void {
  editingProduct.value = product
  formOpen.value = true
}
function openDelete(product: Product): void {
  deletingProduct.value = product
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

const columns = computed<ColumnDef<Product>[]>(() => [
  {
    id: 'thumbnail',
    header: '',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const src = row.original.image_url
      if (src) {
        return h('img', {
          src,
          alt: row.original.name,
          loading: 'lazy',
          class: 'size-10 rounded-md border object-cover',
        })
      }
      return h(
        'div',
        {
          class:
            'bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md border',
        },
        [h(ImageOff, { class: 'size-4' })],
      )
    },
  },
  {
    accessorKey: 'name',
    header: sortableHeader('Name'),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'price',
    header: sortableHeader('Price'),
    cell: ({ row }) =>
      h('span', { class: 'whitespace-nowrap tabular-nums' }, formatMinorToMajor(row.original.price)),
  },
  {
    id: 'category',
    header: 'Category',
    enableSorting: false,
    cell: ({ row }) => {
      const category = row.original.category
      return category
        ? h('span', category.name)
        : h('span', { class: 'text-muted-foreground' }, '—')
    },
  },
  {
    accessorKey: 'stock',
    header: sortableHeader('Stock'),
    cell: ({ row }) => h('span', { class: 'tabular-nums' }, String(row.original.stock)),
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.is_active
        ? h(Badge, { variant: 'secondary' }, () => 'Active')
        : h(Badge, { variant: 'outline' }, () => 'Inactive'),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end' }, [
        h(ProductRowActions, {
          product: row.original,
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
      <h1 class="text-2xl font-semibold tracking-tight">Products</h1>
      <p class="text-muted-foreground text-sm">Manage the catalog of products for sale.</p>
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
      search-placeholder="Search products..."
    >
      <template #toolbar>
        <Button v-can="'catalog.create'" size="sm" @click="openCreate">
          <Plus class="size-4" />
          New product
        </Button>
      </template>
    </DataTable>

    <ProductFormDialog v-model:open="formOpen" :product="editingProduct" />
    <DeleteProductDialog v-model:open="deleteOpen" :product="deletingProduct" />
  </section>
</template>
