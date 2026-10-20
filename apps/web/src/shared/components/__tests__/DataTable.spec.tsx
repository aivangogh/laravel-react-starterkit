import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DataTable,
  type ColumnDef,
  type DataTableProps,
  type PaginationState,
  type SortingState,
} from '@app/ui/components/data-table'

// The @app/ui DataTable is a packages/ui component; it has no test runner of its own, so its
// behaviour is verified here through the app's single `test:unit` gate (imported via the alias).

interface Row {
  id: string
  name: string
  email: string
}

const rows: Row[] = [
  { id: '1', name: 'Ada', email: 'ada@example.com' },
  { id: '2', name: 'Linus', email: 'linus@example.com' },
]

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <button onClick={() => column.toggleSorting()}>Name</button>,
    cell: ({ row }) => <span>{row.getValue('name')}</span>,
  },
  { accessorKey: 'email', header: 'Email' },
]

type HarnessProps = Partial<DataTableProps<Row, unknown>> & {
  data: Row[]
  rowCount: number
  /** Receives every resolved pagination/sorting state the table reports. */
  onPagination?: (state: PaginationState) => void
  onSorting?: (state: SortingState) => void
}

/** Owns the controlled state (as `useServerTable` does) and reports each resolved update. */
function Harness({ onPagination, onSorting, ...props }: HarnessProps) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [sorting, setSorting] = useState<SortingState>([])

  return (
    <DataTable
      columns={columns}
      pagination={pagination}
      onPaginationChange={(updater) => {
        const next = typeof updater === 'function' ? updater(pagination) : updater
        onPagination?.(next)
        setPagination(next)
      }}
      sorting={sorting}
      onSortingChange={(updater) => {
        const next = typeof updater === 'function' ? updater(sorting) : updater
        onSorting?.(next)
        setSorting(next)
      }}
      globalFilter=""
      onGlobalFilterChange={() => {}}
      {...props}
    />
  )
}

describe('DataTable', () => {
  it('reports pagination when paging to the next page', async () => {
    const onPagination = vi.fn()
    render(<Harness data={rows} rowCount={25} onPagination={onPagination} />)

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))

    expect(onPagination).toHaveBeenLastCalledWith(expect.objectContaining({ pageIndex: 1 }))
  })

  it('reports pagination when the page size changes', async () => {
    const onPagination = vi.fn()
    render(<Harness data={rows} rowCount={25} onPagination={onPagination} />)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: '20' }))

    expect(onPagination).toHaveBeenLastCalledWith({ pageIndex: 0, pageSize: 20 })
  })

  it('reports sorting when a sortable header is toggled', async () => {
    const onSorting = vi.fn()
    render(<Harness data={rows} rowCount={25} onSorting={onSorting} />)

    await userEvent.click(screen.getByRole('button', { name: 'Name' }))

    expect(onSorting).toHaveBeenLastCalledWith([{ id: 'name', desc: false }])
  })

  it('reports the global filter after the search debounce', async () => {
    const onGlobalFilterChange = vi.fn()
    render(<Harness data={rows} rowCount={25} onGlobalFilterChange={onGlobalFilterChange} />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'ada')
    // Debounced: nothing reported yet.
    expect(onGlobalFilterChange).not.toHaveBeenCalled()

    await vi.waitFor(() => expect(onGlobalFilterChange).toHaveBeenLastCalledWith('ada'))
    expect(onGlobalFilterChange).toHaveBeenCalledTimes(1)
  })

  it('renders the empty state when there is no data', () => {
    const { container } = render(<Harness data={[]} rowCount={0} />)

    expect(screen.getByText('No results.')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="table-loading"]')).toBeNull()
  })

  it('renders a custom empty state, toolbar and header actions', () => {
    render(
      <Harness
        data={[]}
        rowCount={0}
        empty={<p>Nothing here</p>}
        toolbar={<button>New user</button>}
        headerActions={<button>Export</button>}
      />,
    )

    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByText('No results.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New user' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
  })

  it('renders the loading overlay when loading', () => {
    const { container } = render(<Harness data={[]} rowCount={0} loading />)

    expect(container.querySelector('[data-slot="table-loading"]')).not.toBeNull()
  })
})
