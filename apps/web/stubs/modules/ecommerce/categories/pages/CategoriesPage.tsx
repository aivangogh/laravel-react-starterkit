import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { DataTable, DataTableSortHeader, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { Can } from '@/shared/components/Can'
import type { Category } from '../../types'
import { useCategoriesTable } from '../hooks/useCategories'
import { CategoryRowActions } from '../components/CategoryRowActions'
import { CategoryFormDialog } from '../components/CategoryFormDialog'
import { DeleteCategoryDialog } from '../components/DeleteCategoryDialog'

export function CategoriesPage() {
  const { data, tableProps } = useCategoriesTable()

  // One create/edit dialog and one delete dialog, targeted at the selected row.
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableSortHeader column={column} label="Name" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'slug',
        header: ({ column }) => <DataTableSortHeader column={column} label="Slug" />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono">
            {row.original.slug}
          </Badge>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.description ? (
            <span className="text-muted-foreground line-clamp-1 max-w-md">
              {row.original.description}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <CategoryRowActions
              onEdit={() => {
                setEditingCategory(row.original)
                setFormOpen(true)
              }}
              onDelete={() => {
                setDeletingCategory(row.original)
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
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-muted-foreground text-sm">
          Organize the catalog into product categories.
        </p>
      </header>

      <DataTable
        columns={columns}
        data={data}
        {...tableProps}
        searchPlaceholder="Search categories..."
        toolbar={
          <Can permission="catalog.create">
            <Button
              size="sm"
              onClick={() => {
                setEditingCategory(null)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              New category
            </Button>
          </Can>
        }
      />

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} />
      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        category={deletingCategory}
      />
    </section>
  )
}
