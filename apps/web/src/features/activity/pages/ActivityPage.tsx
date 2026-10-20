import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import type { Activity } from '@app/types'
import { DataTable, DataTableSortHeader, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { useActivityTable } from '@/features/activity/hooks/useActivity'
import { causerLabel, formatActivityDate } from '@/features/activity/lib/format'
import { ActivityDetailDialog } from '@/features/activity/components/ActivityDetailDialog'

export function ActivityPage() {
  const { data, tableProps } = useActivityTable()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const columns = useMemo<ColumnDef<Activity>[]>(
    () => [
      {
        accessorKey: 'description',
        header: 'Description',
        enableSorting: false,
        cell: ({ row }) => <span className="font-medium">{row.original.description}</span>,
      },
      {
        accessorKey: 'log_name',
        header: ({ column }) => <DataTableSortHeader column={column} label="Event" />,
        cell: ({ row }) => {
          const label = row.original.event ?? row.original.log_name
          return label ? <Badge variant="secondary">{label}</Badge> : '—'
        },
      },
      {
        id: 'causer',
        header: 'Causer',
        enableSorting: false,
        cell: ({ row }) => causerLabel(row.original),
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableSortHeader column={column} label="Date" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatActivityDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="View activity detail"
            onClick={() => {
              setSelectedId(row.original.id)
              setDetailOpen(true)
            }}
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-muted-foreground text-sm">
          A record of actions taken across the application.
        </p>
      </header>

      <DataTable
        columns={columns}
        data={data}
        {...tableProps}
        searchPlaceholder="Search activity…"
        empty={<span className="text-muted-foreground">No activity has been recorded yet.</span>}
      />

      <ActivityDetailDialog id={selectedId} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  )
}
