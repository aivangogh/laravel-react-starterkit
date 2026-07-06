import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { AppConfig } from '@app/types'
import { useAppConfig } from '@/shared/composables/useAppConfig'

// Hoisted mock handle so it exists when `vi.mock`'s factory runs.
const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/shared/lib/http', () => ({ http: { get: mocks.get } }))

/** Run a composable inside a mounted component wired with a fresh vue-query client. */
function mountComposable<T>(composable: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  let result!: T
  mount(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  )
  return { result }
}

describe('useAppConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches config from GET /api/config and projects a basic preset', async () => {
    const config: AppConfig = {
      preset: 'basic',
      features: { activity_log: true, media: false },
    }
    mocks.get.mockResolvedValueOnce({ data: config })

    const { result } = mountComposable(() => useAppConfig())
    await flushPromises()

    expect(mocks.get).toHaveBeenCalledWith('/api/config')
    expect(result.config.value).toEqual(config)
    expect(result.preset.value).toBe('basic')
    expect(result.features.value).toEqual({ activity_log: true, media: false })
    expect(result.isEcommerce.value).toBe(false)
  })

  it('flags isEcommerce for the ecommerce preset', async () => {
    mocks.get.mockResolvedValueOnce({
      data: { preset: 'ecommerce', features: {} } satisfies AppConfig,
    })

    const { result } = mountComposable(() => useAppConfig())
    await flushPromises()

    expect(result.preset.value).toBe('ecommerce')
    expect(result.isEcommerce.value).toBe(true)
  })

  it('defaults features to an empty object before data resolves', () => {
    mocks.get.mockReturnValueOnce(new Promise(() => {}))

    const { result } = mountComposable(() => useAppConfig())

    expect(result.config.value).toBeUndefined()
    expect(result.features.value).toEqual({})
    expect(result.isEcommerce.value).toBe(false)
  })
})
