import { useMemo, useState } from 'react'
import { ImageOff, Plus } from 'lucide-react'
import { DataTable, DataTableSortHeader, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { Can } from '@/shared/components/Can'
import type { Product } from '../../types'
import { formatMoney } from '../../lib/money'
import { useProductsTable } from '../hooks/useProducts'
import { ProductRowActions } from '../components/ProductRowActions'
import { ProductFormDialog } from '../components/ProductFormDialog'
import { DeleteProductDialog } from '../components/DeleteProductDialog'

export function ProductsPage() {
  const { data, tableProps } = useProductsTable()

  // One create/edit dialog and one delete dialog, targeted at the selected row.
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: 'thumbnail',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) =>
          row.original.image_url ? (
            <img
              src={row.original.image_url}
              alt={row.original.name}
              loading="lazy"
              className="size-10 rounded-md border object-cover"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md border">
              <ImageOff className="size-4" />
            </div>
          ),
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableSortHeader column={column} label="Name" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'price',
        header: ({ column }) => <DataTableSortHeader column={column} label="Price" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">{formatMoney(row.original.price)}</span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.category ? (
            <span>{row.original.category.name}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'stock',
        header: ({ column }) => <DataTableSortHeader column={column} label="Stock" />,
        cell: ({ row }) => <span className="tabular-nums">{row.original.stock}</span>,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="secondary">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          ),
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ProductRowActions
              onEdit={() => {
                setEditingProduct(row.original)
                setFormOpen(true)
              }}
              onDelete={() => {
                setDeletingProduct(row.original)
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
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-muted-foreground text-sm">Manage the catalog of products for sale.</p>
      </header>

      <DataTable
        columns={columns}
        data={data}
        {...tableProps}
        searchPlaceholder="Search products..."
        toolbar={
          <Can permission="catalog.create">
            <Button
              size="sm"
              onClick={() => {
                setEditingProduct(null)
                setFormOpen(true)
              }}
            >
              <Plus className="size-4" />
              New product
            </Button>
          </Can>
        }
      />

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editingProduct} />
      <DeleteProductDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        product={deletingProduct}
      />
    </section>
  )
}
