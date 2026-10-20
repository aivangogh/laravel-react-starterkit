export { DataTable, type DataTableProps } from './data-table'
export { DataTableSortHeader } from './sort-header'

// Re-export the TanStack table types a consumer needs to type columns and the controlled state,
// so the app can build tables without depending on `@tanstack/react-table` directly.
export type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/react-table'
