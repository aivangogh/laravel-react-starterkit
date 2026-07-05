<script setup lang="ts" generic="TData, TValue = unknown">
import type { HTMLAttributes } from 'vue'
import type {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import { computed, ref, watch } from 'vue'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { useDebounceFn } from '@vueuse/core'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
} from '@lucide/vue'
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
import { valueUpdater } from '@app/ui/components/ui/table/utils'
import { cn } from '@app/ui/lib/utils'

/**
 * Generic, controlled/presentational data table. It renders whatever `data`/`columns` it is
 * handed and emits state changes via v-model — it NEVER fetches. Pair it with `useServerTable`
 * (in the app) which owns the state refs, calls the API, and binds back the results.
 *
 * Props are declared inline: a generic `<script setup>` cannot reference a named props
 * interface (it would leak the component's `TData`/`TValue` type params).
 */
const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    /** Total server-side row count (drives the page count under `manualPagination`). */
    rowCount: number
    loading?: boolean
    pageSizeOptions?: number[]
    searchPlaceholder?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    loading: false,
    pageSizeOptions: () => [5, 10, 20, 30],
    searchPlaceholder: 'Search...',
  },
)

const pagination = defineModel<PaginationState>('pagination', {
  default: () => ({ pageIndex: 0, pageSize: 10 }),
})
const sorting = defineModel<SortingState>('sorting', { default: () => [] })
const globalFilter = defineModel<string>('globalFilter', { default: '' })
const columnVisibility = defineModel<VisibilityState>('columnVisibility', {
  default: () => ({}),
})
const rowSelection = defineModel<RowSelectionState>('rowSelection', {
  default: () => ({}),
})

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  get rowCount() {
    return props.rowCount
  },
  getCoreRowModel: getCoreRowModel(),
  // Server-driven: the table only holds state, it does not paginate/sort/filter locally.
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  onPaginationChange: (updater) => valueUpdater(updater, pagination),
  onSortingChange: (updater) => valueUpdater(updater, sorting),
  onGlobalFilterChange: (updater) => valueUpdater(updater, globalFilter),
  onColumnVisibilityChange: (updater) => valueUpdater(updater, columnVisibility),
  onRowSelectionChange: (updater) => valueUpdater(updater, rowSelection),
  state: {
    get pagination() {
      return pagination.value
    },
    get sorting() {
      return sorting.value
    },
    get globalFilter() {
      return globalFilter.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
})

// --- Debounced global search -------------------------------------------------
// A local input model so keystrokes are debounced (~200ms) before they hit the
// `globalFilter` v-model — one request per pause, not per keypress.
const search = ref(globalFilter.value)
const commitSearch = useDebounceFn((value: string) => {
  if (value !== globalFilter.value) globalFilter.value = value
}, 200)
watch(search, (value) => commitSearch(value))
// Reflect external `globalFilter` changes (e.g. a programmatic reset) back into the input.
watch(globalFilter, (value) => {
  if (value !== search.value) search.value = value
})

const pageCount = computed(() => Math.max(table.getPageCount(), 1))
const currentPage = computed(() => table.getState().pagination.pageIndex + 1)
const selectedCount = computed(() => Object.keys(rowSelection.value).length)
const skeletonRowCount = computed(() => Math.min(table.getState().pagination.pageSize, 8))

function handlePageSizeChange(value: unknown) {
  // Changing the page size returns to the first page.
  pagination.value = { pageIndex: 0, pageSize: Number(value) }
}
</script>

<template>
  <div :class="cn('space-y-4', props.class)">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative w-full max-w-sm">
        <Search
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2"
        />
        <Input v-model="search" :placeholder="props.searchPlaceholder" aria-label="Search" class="pl-8" />
      </div>

      <slot name="toolbar" />

      <div class="ml-auto flex items-center gap-2">
        <slot name="header-actions" />

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              Columns
              <ChevronDown class="ml-1 size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              v-for="column in table.getAllColumns().filter((c) => c.getCanHide())"
              :key="column.id"
              class="capitalize"
              :model-value="column.getIsVisible()"
              @update:model-value="(value) => column.toggleVisibility(!!value)"
            >
              {{ column.id }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Table -->
    <div class="relative overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <!-- Skeleton rows for the initial load (no previous data to keep). -->
          <template v-if="props.loading && !table.getRowModel().rows.length">
            <TableRow v-for="n in skeletonRowCount" :key="`skeleton-${n}`">
              <TableCell v-for="col in props.columns.length" :key="col">
                <Skeleton class="h-5 w-full" />
              </TableCell>
            </TableRow>
          </template>

          <!-- Data rows. -->
          <template v-else-if="table.getRowModel().rows.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>

          <!-- Empty state. -->
          <TableRow v-else>
            <TableCell :colspan="props.columns.length" class="h-24 text-center">
              <slot name="empty">
                <span class="text-muted-foreground">No results.</span>
              </slot>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- Subtle overlay so previously fetched rows stay visible while paging. -->
      <div
        v-if="props.loading"
        data-slot="table-loading"
        role="status"
        aria-live="polite"
        class="bg-background/50 absolute inset-0 flex items-center justify-center backdrop-blur-[1px]"
      >
        <Loader2 class="text-muted-foreground size-6 animate-spin" />
        <span class="sr-only">Loading</span>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="text-muted-foreground flex-1 text-sm">
        <template v-if="selectedCount">
          {{ selectedCount }} of {{ props.rowCount }} row(s) selected.
        </template>
        <template v-else> {{ props.rowCount }} row(s) total. </template>
      </div>

      <div class="flex items-center gap-2">
        <p class="text-sm font-medium">Rows per page</p>
        <Select
          :model-value="String(table.getState().pagination.pageSize)"
          @update:model-value="handlePageSizeChange"
        >
          <SelectTrigger class="h-8 w-[72px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem v-for="size in props.pageSizeOptions" :key="size" :value="String(size)">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">Page {{ currentPage }} of {{ pageCount }}</span>
        <div class="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            :disabled="!table.getCanPreviousPage()"
            aria-label="First page"
            @click="table.setPageIndex(0)"
          >
            <ChevronsLeft class="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            :disabled="!table.getCanPreviousPage()"
            aria-label="Previous page"
            @click="table.previousPage()"
          >
            <ChevronLeft class="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            :disabled="!table.getCanNextPage()"
            aria-label="Next page"
            @click="table.nextPage()"
          >
            <ChevronRight class="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            :disabled="!table.getCanNextPage()"
            aria-label="Last page"
            @click="table.setPageIndex(pageCount - 1)"
          >
            <ChevronsRight class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
