<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { ArrowUpDown, Plus } from 'lucide-vue-next'
import type { User } from '@app/types'
import { DataTable, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { useUsersTable } from '@/features/users/composables/useUsers'
import UserRowActions from '@/features/users/components/UserRowActions.vue'
import UserFormDialog from '@/features/users/components/UserFormDialog.vue'
import DeleteUserDialog from '@/features/users/components/DeleteUserDialog.vue'

const { data, rowCount, loading, pagination, sorting, globalFilter, columnVisibility } =
  useUsersTable()

// One create/edit dialog and one delete dialog, targeted at the selected row.
const formOpen = ref(false)
const editingUser = ref<User | null>(null)
const deleteOpen = ref(false)
const deletingUser = ref<User | null>(null)

function openCreate(): void {
  editingUser.value = null
  formOpen.value = true
}
function openEdit(user: User): void {
  editingUser.value = user
  formOpen.value = true
}
function openDelete(user: User): void {
  deletingUser.value = user
  deleteOpen.value = true
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

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

const columns = computed<ColumnDef<User>[]>(() => [
  {
    accessorKey: 'name',
    header: sortableHeader('Name'),
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'email',
    header: sortableHeader('Email'),
    cell: ({ row }) => h('span', { class: 'text-muted-foreground' }, row.original.email),
  },
  {
    id: 'roles',
    header: 'Roles',
    enableSorting: false,
    cell: ({ row }) => {
      const roles = row.original.roles
      if (!roles.length) return h('span', { class: 'text-muted-foreground' }, '—')
      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        roles.map((role) => h(Badge, { variant: 'secondary', class: 'capitalize' }, () => role)),
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: sortableHeader('Created'),
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
        h(UserRowActions, {
          user: row.original,
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
      <h1 class="text-2xl font-semibold tracking-tight">Users</h1>
      <p class="text-muted-foreground text-sm">Manage user accounts and their role assignments.</p>
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
      search-placeholder="Search users..."
    >
      <template #toolbar>
        <Button v-can="'users.create'" size="sm" @click="openCreate">
          <Plus class="size-4" />
          New user
        </Button>
      </template>
    </DataTable>

    <UserFormDialog v-model:open="formOpen" :user="editingUser" />
    <DeleteUserDialog v-model:open="deleteOpen" :user="deletingUser" />
  </section>
</template>
