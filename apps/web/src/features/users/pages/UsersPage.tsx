import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { User } from '@app/types'
import { DataTable, DataTableSortHeader, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { Can } from '@/shared/components/Can'
import { useUsersTable } from '@/features/users/hooks/useUsers'
import { UserRowActions } from '@/features/users/components/UserRowActions'
import { UserFormDialog } from '@/features/users/components/UserFormDialog'
import { DeleteUserDialog } from '@/features/users/components/DeleteUserDialog'

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function UsersPage() {
  const { data, tableProps } = useUsersTable()

  // One create/edit dialog and one delete dialog, targeted at the selected row.
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableSortHeader column={column} label="Name" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableSortHeader column={column} label="Email" />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      {
        id: 'roles',
        header: 'Roles',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.roles.length ? (
            <div className="flex flex-wrap gap-1">
              {row.original.roles.map((role) => (
                <Badge key={role} variant="secondary" className="capitalize">
                  {role}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableSortHeader column={column} label="Created" />,
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
            <UserRowActions
              onEdit={() => {
                setEditingUser(row.original)
                setFormOpen(true)
              }}
              onDelete={() => {
                setDeletingUser(row.original)
                setDeleteOpen(true)
              }}
            />
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          Manage user accounts and their role assignments.
        </p>
      </header>

      <DataTable
        columns={columns}
        data={data}
        {...tableProps}
        searchPlaceholder="Search users..."
        toolbar={
          <Can permission="users.create">
            <Button
              size="sm"
              onClick={() => {
                setEditingUser(null)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              New user
            </Button>
          </Can>
        }
      />

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />
      <DeleteUserDialog open={deleteOpen} onOpenChange={setDeleteOpen} user={deletingUser} />
    </section>
  )
}
