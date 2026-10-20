import type { Column } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@app/ui/components/ui/button'

/**
 * A column header that toggles the column's (server-side) sort via a ghost button:
 * `header: ({ column }) => <DataTableSortHeader column={column} label="Name" />`.
 */
export function DataTableSortHeader<TData, TValue>({
  column,
  label,
}: {
  column: Column<TData, TValue>
  label: string
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 size-3.5" />
    </Button>
  )
}
