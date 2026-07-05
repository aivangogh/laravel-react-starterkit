import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, type App } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { useActivityDetail, useActivityTable } from '@/features/activity/composables/useActivity'

// Hoisted mock so the `vi.mock` factory can reference it.
const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get },
}))

/** Run a composable inside a throwaway app wired with VueQueryPlugin so `useQuery` runs. */
function withSetup<T>(composable: () => T): { result: T; app: App } {
  let result!: T
  const app = createApp({
    setup() {
      result = composable()
      return () => null
    },
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  app.use(VueQueryPlugin, { queryClient })
  app.mount(document.createElement('div'))
  return { result, app }
}

const emptyPage = { data: { data: [], meta: { total: 0 } } }

describe('useActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.get.mockResolvedValue(emptyPage)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('lists from /api/activity-log with the default table params', async () => {
    withSetup(() => useActivityTable())

    await vi.waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith('/api/activity-log', {
        params: expect.objectContaining({ page: 1, per_page: 10 }),
      })
    })
  })

  it('forwards search and sort state as q/sort/dir params', async () => {
    const { result } = withSetup(() => useActivityTable())
    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalled())

    result.globalFilter.value = 'deleted'
    result.sorting.value = [{ id: 'created_at', desc: true }]

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
    withSetup(() => useActivityDetail(42))

    await vi.waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith('/api/activity-log/42')
    })
  })

  it('does not fetch a detail while the id is null (dialog closed)', async () => {
    withSetup(() => useActivityDetail(null))

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(mocks.get).not.toHaveBeenCalled()
  })
})
