export { default as DataTable } from './DataTable.vue'

// Re-export the TanStack table types a consumer needs to type columns and the v-model state,
// so the app can build tables without depending on `@tanstack/vue-table` directly.
export type {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
