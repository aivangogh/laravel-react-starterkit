<script setup lang="ts">
import { h, ref } from 'vue'
import { ArrowUpDown, Plus } from 'lucide-vue-next'
import type { ColumnDef } from '@app/ui/components/data-table'
import { DataTable } from '@app/ui/components/data-table'
import { Button } from '@app/ui/components/ui/button'
import { useRolesTable, type RoleRow } from '@/features/roles/composables/useRoles'
import RolePermissionsCell from '@/features/roles/components/RolePermissionsCell.vue'
import RoleRowActions from '@/features/roles/components/RoleRowActions.vue'
import RoleFormDialog from '@/features/roles/components/RoleFormDialog.vue'
import DeleteRoleDialog from '@/features/roles/components/DeleteRoleDialog.vue'

/**
 * Roles & permissions index. Renders the server-driven roles table (via {@link useRolesTable} +
 * the shared `@app/ui` DataTable) and hosts the create/edit and delete dialogs. Row actions and
 * the "New role" button are permission-gated.
 */
const {
  pagination,
  sorting,
  globalFilter,
  columnVisibility,
  rowSelection,
  data,
  rowCount,
  loading,
} = useRolesTable()

// --- Dialog state ------------------------------------------------------------
const formOpen = ref(false)
const editingRole = ref<RoleRow | null>(null)
const deleteOpen = ref(false)
const deletingRole = ref<RoleRow | null>(null)

function openCreate(): void {
  editingRole.value = null
  formOpen.value = true
}

function openEdit(role: RoleRow): void {
  editingRole.value = role
  formOpen.value = true
}

function openDelete(role: RoleRow): void {
  deletingRole.value = role
  deleteOpen.value = true
}

// --- Cell helpers ------------------------------------------------------------
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function formatDate(value?: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : dateFormatter.format(parsed)
}

/** Minimal structural view of a TanStack column — avoids depending on `@tanstack/vue-table` here. */
interface SortableColumn {
  getIsSorted: () => false | 'asc' | 'desc'
  toggleSorting: (desc?: boolean) => void
}

function renderSortHeader(column: SortableColumn, label: string) {
  return h(
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

// --- Columns -----------------------------------------------------------------
const columns: ColumnDef<RoleRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => renderSortHeader(column, 'Name'),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    id: 'permissions',
    header: 'Permissions',
    enableSorting: false,
    cell: ({ row }) => h(RolePermissionsCell, { permissions: row.original.permissions }),
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => renderSortHeader(column, 'Created'),
    cell: ({ row }) =>
      h('span', { class: 'text-muted-foreground text-sm' }, formatDate(row.original.created_at)),
  },
  {
    id: 'actions',
    header: () => h('span', { class: 'sr-only' }, 'Actions'),
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) =>
      h(RoleRowActions, {
        role: row.original,
        onEdit: () => openEdit(row.original),
        onDelete: () => openDelete(row.original),
      }),
  },
]
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">Roles &amp; permissions</h1>
      <p class="text-muted-foreground text-sm">
        Define roles and the permissions they grant to the users assigned to them.
      </p>
    </header>

    <DataTable
      v-model:pagination="pagination"
      v-model:sorting="sorting"
      v-model:global-filter="globalFilter"
      v-model:column-visibility="columnVisibility"
      v-model:row-selection="rowSelection"
      :columns="columns"
      :data="data"
      :row-count="rowCount"
      :loading="loading"
      search-placeholder="Search roles..."
    >
      <template #toolbar>
        <Button v-can="'roles.create'" size="sm" @click="openCreate">
          <Plus class="size-4" />
          New role
        </Button>
      </template>
    </DataTable>

    <RoleFormDialog v-model:open="formOpen" :role="editingRole" />
    <DeleteRoleDialog v-model:open="deleteOpen" :role="deletingRole" />
  </div>
</template>
