import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import type { Paginated } from '@app/types'
import { useServerTable } from '@/shared/hooks/useServerTable'
import { tableKeys } from '@/shared/lib/query-keys'
import { renderHookWithQuery } from '@/test/utils'

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

/** Run the hook inside a fresh QueryClient and wait for the first page to land. */
async function renderTable() {
  const rendered = renderHookWithQuery(() =>
    useServerTable<Row>({ resource: 'users', endpoint: '/api/users' }),
  )
  await vi.waitFor(() => expect(rendered.result.current.data).toEqual(page.data))
  return rendered
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

  it('sends the standard list-contract params and maps the Paginated response', async () => {
    const { result } = await renderTable()

    // Default state: page 1, default per_page, no sort/q.
    expect(mocks.get).toHaveBeenCalledWith('/api/users', {
      params: { page: 1, per_page: 10 },
    })

    // Maps `data` + `meta.total`.
    expect(result.current.data).toEqual(page.data)
    expect(result.current.tableProps.rowCount).toBe(42)
  })

  it('accepts an unpaginated bare-array collection and counts its rows', async () => {
    // e.g. GET /api/tokens: unpaginated + `JsonResource::withoutWrapping()` → a bare array.
    mocks.get.mockResolvedValue({ data: page.data })
    const { result } = await renderTable()

    expect(result.current.tableProps.rowCount).toBe(2)
  })

  it('serialises sorting into sort/dir', async () => {
    const { result } = await renderTable()

    act(() => result.current.tableProps.onSortingChange([{ id: 'email', desc: true }]))

    await vi.waitFor(() =>
      expect(lastParams()).toEqual({ page: 1, per_page: 10, sort: 'email', dir: 'desc' }),
    )
  })

  it('serialises the global filter into q and resets to the first page', async () => {
    const { result } = await renderTable()

    act(() => result.current.tableProps.onPaginationChange({ pageIndex: 3, pageSize: 10 }))
    await vi.waitFor(() => expect(lastParams()).toEqual({ page: 4, per_page: 10 }))

    act(() => result.current.tableProps.onGlobalFilterChange('ada'))

    // q added, and the page reset back to 1.
    await vi.waitFor(() => expect(lastParams()).toEqual({ page: 1, per_page: 10, q: 'ada' }))
  })

  it('maps page as pageIndex + 1 and per_page as pageSize', async () => {
    const { result } = await renderTable()

    act(() => result.current.tableProps.onPaginationChange({ pageIndex: 2, pageSize: 20 }))

    await vi.waitFor(() => expect(lastParams()).toEqual({ page: 3, per_page: 20 }))
  })

  it('builds the expected query key from resource + params', () => {
    expect(tableKeys.list('users', { page: 1, per_page: 10 })).toEqual([
      'table',
      'users',
      { page: 1, per_page: 10 },
    ])
  })
})
