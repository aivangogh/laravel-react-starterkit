import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { DataTable, DataTableSortHeader, type ColumnDef } from '@app/ui/components/data-table'
import { Button } from '@app/ui/components/ui/button'
import { Can } from '@/shared/components/Can'
import { useRolesTable, type RoleRow } from '@/features/roles/hooks/useRoles'
import { RolePermissionsCell } from '@/features/roles/components/RolePermissionsCell'
import { RoleRowActions } from '@/features/roles/components/RoleRowActions'
import { RoleFormDialog } from '@/features/roles/components/RoleFormDialog'
import { DeleteRoleDialog } from '@/features/roles/components/DeleteRoleDialog'

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function formatDate(value?: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : dateFormatter.format(parsed)
}

/**
 * Roles & permissions index. Renders the server-driven roles table (via `useRolesTable` + the
 * shared `@app/ui` DataTable) and hosts the create/edit and delete dialogs. Row actions and the
 * "New role" button are permission-gated.
 */
export function RolesPage() {
  const { data, tableProps } = useRolesTable()

  // One create/edit dialog and one delete dialog, targeted at the selected row.
  const [formOpen, setFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingRole, setDeletingRole] = useState<RoleRow | null>(null)

  const columns = useMemo<ColumnDef<RoleRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableSortHeader column={column} label="Name" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: 'permissions',
        header: 'Permissions',
        enableSorting: false,
        cell: ({ row }) => <RolePermissionsCell permissions={row.original.permissions} />,
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableSortHeader column={column} label="Created" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <RoleRowActions
            role={row.original}
            onEdit={() => {
              setEditingRole(row.original)
              setFormOpen(true)
            }}
            onDelete={() => {
              setDeletingRole(row.original)
              setDeleteOpen(true)
            }}
          />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Roles &amp; permissions</h1>
        <p className="text-muted-foreground text-sm">
          Define roles and the permissions they grant to the users assigned to them.
        </p>
      </header>

      <DataTable
        columns={columns}
        data={data}
        {...tableProps}
        searchPlaceholder="Search roles..."
        toolbar={
          <Can permission="roles.create">
            <Button
              size="sm"
              onClick={() => {
                setEditingRole(null)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              New role
            </Button>
          </Can>
        }
      />

      <RoleFormDialog open={formOpen} onOpenChange={setFormOpen} role={editingRole} />
      <DeleteRoleDialog open={deleteOpen} onOpenChange={setDeleteOpen} role={deletingRole} />
    </div>
  )
}
