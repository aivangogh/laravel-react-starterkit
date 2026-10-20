import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHookWithQuery } from '@/test/utils'
import { useActivityDetail, useActivityTable } from '@/features/activity/hooks/useActivity'

// Hoisted mock so the `vi.mock` factory can reference it.
const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get },
}))

const emptyPage = { data: { data: [], meta: { total: 0 } } }

describe('useActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.get.mockResolvedValue(emptyPage)
  })

  it('lists from /api/activity-log with the default table params', async () => {
    renderHookWithQuery(() => useActivityTable())

    await vi.waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith('/api/activity-log', {
        params: expect.objectContaining({ page: 1, per_page: 10 }),
      })
    })
  })

  it('forwards search and sort state as q/sort/dir params', async () => {
    const { result } = renderHookWithQuery(() => useActivityTable())
    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())

    act(() => {
      result.current.tableProps.onGlobalFilterChange('deleted')
      result.current.tableProps.onSortingChange([{ id: 'created_at', desc: true }])
    })

    await vi.waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith('/api/activity-log', {
        params: expect.objectContaining({
          q: 'deleted',
          sort: 'created_at',
          dir: 'desc',
          page: 1,
        }),
      })
    })
  })

  it('fetches a single entry from /api/activity-log/{id}', async () => {
    mocks.get.mockResolvedValue({ data: { id: 42 } })
    renderHookWithQuery(() => useActivityDetail(42))

    await vi.waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith('/api/activity-log/42')
    })
  })

  it('does not fetch a detail while the id is null (dialog closed)', async () => {
    renderHookWithQuery(() => useActivityDetail(null))

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(mocks.get).not.toHaveBeenCalled()
  })
})
