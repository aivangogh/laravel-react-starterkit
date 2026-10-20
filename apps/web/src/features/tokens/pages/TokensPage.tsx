import { useMemo } from 'react'
import type { ApiToken } from '@app/types'
import { DataTable, DataTableSortHeader, type ColumnDef } from '@app/ui/components/data-table'
import { Badge } from '@app/ui/components/ui/badge'
import { useTokens } from '@/features/tokens/hooks/useTokens'
import { CreateTokenDialog } from '@/features/tokens/components/CreateTokenDialog'
import { RevokeTokenButton } from '@/features/tokens/components/RevokeTokenButton'

// One formatter for every date column; nulls render as "Never".
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
function formatDate(value: string | null): string {
  return value ? dateFormat.format(new Date(value)) : 'Never'
}

export function TokensPage() {
  const { data, tableProps, revokeMutation } = useTokens()
  const revoke = revokeMutation.mutateAsync

  const columns = useMemo<ColumnDef<ApiToken>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableSortHeader column={column} label="Name" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'abilities',
        header: 'Abilities',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.abilities.length ? (
            <div className="flex flex-wrap gap-1">
              {row.original.abilities.map((ability) => (
                <Badge key={ability} variant="secondary">
                  {ability === '*' ? 'all' : ability}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'last_used_at',
        header: ({ column }) => <DataTableSortHeader column={column} label="Last used" />,
        cell: ({ row }) => formatDate(row.original.last_used_at),
      },
      {
        accessorKey: 'expires_at',
        header: 'Expires',
        enableSorting: false,
        cell: ({ row }) => formatDate(row.original.expires_at),
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableSortHeader column={column} label="Created" />,
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="text-right">
            <RevokeTokenButton token={row.original} confirm={revoke} />
          </div>
        ),
      },
    ],
    [revoke],
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">API Tokens</h1>
        <p className="text-muted-foreground text-sm">
          Personal access tokens authenticate API requests on your behalf.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        {...tableProps}
        searchPlaceholder="Search tokens..."
        toolbar={<CreateTokenDialog />}
        empty={
          <span className="text-muted-foreground">You haven't created any API tokens yet.</span>
        }
      />
    </div>
  )
}
