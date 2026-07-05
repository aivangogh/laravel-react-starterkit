import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import type { ColumnDef } from '@app/ui/components/data-table'
import { DataTable } from '@app/ui/components/data-table'
import { Select } from '@app/ui/components/ui/select'

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
    header: ({ column }) =>
      h('button', { class: 'sort-name', onClick: () => column.toggleSorting() }, 'Name'),
    cell: ({ row }) => h('span', {}, row.getValue('name') as string),
  },
  { accessorKey: 'email', header: 'Email' },
]

// `mount()` cannot infer the SFC generic `TData` from the passed props (a @vue/test-utils
// limitation), so it resolves to `unknown` — widen the authored columns at that boundary.
const tableColumns = columns as unknown as ColumnDef<unknown, unknown>[]

function mountTable(props: { data: Row[]; rowCount: number; loading?: boolean }) {
  return mount(DataTable, { props: { columns: tableColumns, ...props } })
}

describe('DataTable', () => {
  beforeEach(() => {
    // reka-ui primitives reference this browser API that jsdom lacks.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emits update:pagination when paging to the next page', async () => {
    const wrapper = mountTable({ data: rows, rowCount: 25 })

    await wrapper.get('[aria-label="Next page"]').trigger('click')

    const events = wrapper.emitted('update:pagination')
    expect(events).toBeTruthy()
    expect(events!.at(-1)![0]).toMatchObject({ pageIndex: 1 })
  })

  it('emits update:pagination when the page size changes', async () => {
    const wrapper = mountTable({ data: rows, rowCount: 25 })

    wrapper.findComponent(Select).vm.$emit('update:modelValue', '20')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:pagination')!.at(-1)![0]).toEqual({
      pageIndex: 0,
      pageSize: 20,
    })
  })

  it('emits update:sorting when a sortable header is toggled', async () => {
    const wrapper = mountTable({ data: rows, rowCount: 25 })

    await wrapper.get('button.sort-name').trigger('click')

    const events = wrapper.emitted('update:sorting')
    expect(events).toBeTruthy()
    expect(events!.at(-1)![0]).toEqual([{ id: 'name', desc: false }])
  })

  it('emits update:globalFilter after the search debounce', async () => {
    const wrapper = mountTable({ data: rows, rowCount: 25 })

    await wrapper.get('input[aria-label="Search"]').setValue('ada')
    // Debounced: nothing emitted yet.
    expect(wrapper.emitted('update:globalFilter')).toBeFalsy()

    await new Promise((resolve) => setTimeout(resolve, 260))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:globalFilter')!.at(-1)![0]).toBe('ada')
  })

  it('renders the empty state when there is no data', () => {
    const wrapper = mountTable({ data: [], rowCount: 0 })

    expect(wrapper.text()).toContain('No results.')
    expect(wrapper.find('[data-slot="table-loading"]').exists()).toBe(false)
  })

  it('renders the loading overlay when loading', () => {
    const wrapper = mountTable({ data: [], rowCount: 0, loading: true })

    expect(wrapper.find('[data-slot="table-loading"]').exists()).toBe(true)
  })
})
