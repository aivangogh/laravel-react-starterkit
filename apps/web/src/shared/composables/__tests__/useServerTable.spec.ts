import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Paginated } from '@app/types'
import { tableKeys } from '@/shared/lib/query-keys'
import { useServerTable } from '@/shared/composables/useServerTable'

// Hoisted mock so `vi.mock`'s factory can reference it.
const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get },
}))

interface Row {
  id: string
  name: string
}

const page: Paginated<Row> = {
  data: [
    { id: '1', name: 'Ada' },
    { id: '2', name: 'Linus' },
  ],
  meta: { current_page: 1, last_page: 5, per_page: 10, total: 42 },
}

/** Mount a throwaway component so the composable runs inside a real setup + QueryClient. */
function mountComposable() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let api!: ReturnType<typeof useServerTable<Row>>

  const wrapper = mount(
    defineComponent({
      setup() {
        api = useServerTable<Row>({ resource: 'users', endpoint: '/api/users' })
        return () => h('div')
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } },
  )

  return { wrapper, api: () => api }
}

/** Params of the most recent `http.get` call. */
function lastParams(): Record<string, unknown> {
  const call = mocks.get.mock.calls.at(-1)
  return (call?.[1] as { params: Record<string, unknown> }).params
}

describe('useServerTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.get.mockResolvedValue({ data: page })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the standard list-contract params and maps the Paginated response', async () => {
    const { api } = mountComposable()
    await flushPromises()

    // Default state: page 1, default per_page, no sort/q.
    expect(mocks.get).toHaveBeenCalledWith('/api/users', {
      params: { page: 1, per_page: 10 },
    })

    // Maps `data` + `meta.total`.
    expect(api().data.value).toEqual(page.data)
    expect(api().rowCount.value).toBe(42)
  })

  it('serialises sorting into sort/dir', async () => {
    const { api } = mountComposable()
    await flushPromises()

    api().sorting.value = [{ id: 'email', desc: true }]
    await flushPromises()

    expect(lastParams()).toEqual({ page: 1, per_page: 10, sort: 'email', dir: 'desc' })
  })

  it('serialises the global filter into q and resets to the first page', async () => {
    const { api } = mountComposable()
    await flushPromises()

    api().pagination.value = { pageIndex: 3, pageSize: 10 }
    await flushPromises()
    expect(lastParams()).toEqual({ page: 4, per_page: 10 })

    api().globalFilter.value = 'ada'
    await flushPromises()

    // q added, and the page reset back to 1.
    expect(lastParams()).toEqual({ page: 1, per_page: 10, q: 'ada' })
  })

  it('maps page as pageIndex + 1 and per_page as pageSize', async () => {
    const { api } = mountComposable()
    await flushPromises()

    api().pagination.value = { pageIndex: 2, pageSize: 20 }
    await flushPromises()

    expect(lastParams()).toEqual({ page: 3, per_page: 20 })
  })

  it('builds the expected query key from resource + params', () => {
    expect(tableKeys.list('users', { page: 1, per_page: 10 })).toEqual([
      'table',
      'users',
      { page: 1, per_page: 10 },
    ])
  })
})
