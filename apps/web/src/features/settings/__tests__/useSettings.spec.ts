import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { GeneralSettings } from '@app/types'
import { settingsKeys } from '@/shared/lib/query-keys'
import { useSettings } from '@/features/settings/composables/useSettings'

// Hoisted mock handles so they exist when `vi.mock`'s factory runs.
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get, put: mocks.put },
  ensureCsrfCookie: mocks.ensureCsrfCookie,
}))

const settings: GeneralSettings = {
  app_name: 'Starter Kit',
  support_email: 'help@example.com',
  registration_enabled: true,
}

/** Run a composable inside a mounted component wired with a fresh vue-query client. */
function mountComposable<T>(composable: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  let result!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  )
  return { result, wrapper, queryClient, invalidateSpy }
}

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
  })

  it('fetches general settings from GET /api/settings', async () => {
    mocks.get.mockResolvedValueOnce({ data: settings })

    const { result } = mountComposable(() => useSettings())
    await flushPromises()

    expect(mocks.get).toHaveBeenCalledWith('/api/settings')
    expect(result.settingsQuery.data.value).toEqual(settings)
  })

  it('updates via PUT /api/settings and invalidates the detail key', async () => {
    mocks.get.mockResolvedValue({ data: settings })
    const updated: GeneralSettings = {
      ...settings,
      app_name: 'Renamed',
      registration_enabled: false,
    }
    mocks.put.mockResolvedValueOnce({ data: updated })

    const { result, invalidateSpy } = mountComposable(() => useSettings())
    await flushPromises()

    const payload = {
      app_name: 'Renamed',
      support_email: 'help@example.com',
      registration_enabled: false,
    }
    const returned = await result.updateMutation.mutateAsync(payload)
    await flushPromises()

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.put).toHaveBeenCalledWith('/api/settings', payload)
    expect(returned).toEqual(updated)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: settingsKeys.detail() })
  })
})
