import { useEffect, useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
} from 'lucide-react'
import { Button } from '@app/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@app/ui/components/ui/dropdown-menu'
import { Input } from '@app/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@app/ui/components/ui/select'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@app/ui/components/ui/table'
import { cn } from '@app/ui/lib/utils'

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Total server-side row count (drives the page count under `manualPagination`). */
  rowCount: number
  loading?: boolean
  pageSizeOptions?: number[]
  searchPlaceholder?: string
  className?: string
  /** Server-driven state — owned by the caller (see the app's `useServerTable`). */
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  /** Rendered after the search box (e.g. a "New user" button). */
  toolbar?: ReactNode
  /** Rendered right-aligned, before the Columns menu. */
  headerActions?: ReactNode
  /** Replaces the default "No results." empty state. */
  empty?: ReactNode
}

/**
 * Generic, controlled/presentational data table. It renders whatever `data`/`columns` it is handed
 * and reports server-driven state changes (page/sort/search) via callbacks — it NEVER fetches. Pair
 * it with `useServerTable` (in the app), which owns that state, calls the API, and passes results back.
 * Column visibility and row selection are purely local UI state, so the table keeps them itself.
 */
export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  rowCount,
  loading = false,
  pageSizeOptions = [5, 10, 20, 30],
  searchPlaceholder = 'Search...',
  className,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  toolbar,
  headerActions,
  empty,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // TanStack Table returns non-memoizable functions by design; the React Compiler lint flags that.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    rowCount,
    getCoreRowModel: getCoreRowModel(),
    // Server-driven: the table only holds state, it does not paginate/sort/filter locally.
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { pagination, sorting, globalFilter, columnVisibility, rowSelection },
  })

  // Debounced global search: a local input value so keystrokes are committed (~200ms) as one
  // request per pause, not per keypress. External resets of `globalFilter` flow back into the input.
  const [search, setSearch] = useState(globalFilter)
  const [syncedFilter, setSyncedFilter] = useState(globalFilter)
  if (syncedFilter !== globalFilter) {
    setSyncedFilter(globalFilter)
    setSearch(globalFilter)
  }
  useEffect(() => {
    if (search === globalFilter) return
    const timer = setTimeout(() => onGlobalFilterChange(search), 200)
    return () => clearTimeout(timer)
  }, [search, globalFilter, onGlobalFilterChange])

  const pageCount = Math.max(table.getPageCount(), 1)
  const currentPage = pagination.pageIndex + 1
  const selectedCount = Object.keys(rowSelection).length
  const skeletonRowCount = Math.min(pagination.pageSize, 8)
  const rows = table.getRowModel().rows

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search"
            className="pl-8"
          />
        </div>

        {toolbar}

        <div className="ml-auto flex items-center gap-2">
          {headerActions}

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              Columns
              <ChevronDown className="ml-1 size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading && !rows.length ? (
              // Skeleton rows for the initial load (no previous data to keep).
              Array.from({ length: skeletonRowCount }, (_, n) => (
                <TableRow key={`skeleton-${n}`}>
                  {columns.map((_, col) => (
                    <TableCell key={col}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {empty ?? <span className="text-muted-foreground">No results.</span>}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Subtle overlay so previously fetched rows stay visible while paging. */}
        {loading && (
          <div
            data-slot="table-loading"
            role="status"
            aria-live="polite"
            className="bg-background/50 absolute inset-0 flex items-center justify-center backdrop-blur-[1px]"
          >
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
            <span className="sr-only">Loading</span>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {selectedCount
            ? `${selectedCount} of ${rowCount} row(s) selected.`
            : `${rowCount} row(s) total.`}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={String(pagination.pageSize)}
            // Changing the page size returns to the first page.
            onValueChange={(value) =>
              onPaginationChange({ pageIndex: 0, pageSize: Number(value) })
            }
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Page {currentPage} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
              onClick={() => table.setPageIndex(0)}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
              onClick={() => table.setPageIndex(pageCount - 1)}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
