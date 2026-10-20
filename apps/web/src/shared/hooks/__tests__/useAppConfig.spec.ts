import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppConfig } from '@app/types'
import { ensureModuleEnabled, useAppConfig } from '@/shared/hooks/useAppConfig'
import { createTestQueryClient, renderHookWithQuery } from '@/test/utils'

// Hoisted mock handle so it exists when `vi.mock`'s factory runs.
const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/shared/lib/http', () => ({ http: { get: mocks.get } }))

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

    const { result } = renderHookWithQuery(() => useAppConfig())
    await vi.waitFor(() => expect(result.current.config).toEqual(config))

    expect(mocks.get).toHaveBeenCalledWith('/api/config')
    expect(result.current.preset).toBe('basic')
    expect(result.current.features).toEqual({ activity_log: true, media: false })
    expect(result.current.isEcommerce).toBe(false)
  })

  it('flags isEcommerce for the ecommerce preset', async () => {
    mocks.get.mockResolvedValueOnce({
      data: { preset: 'ecommerce', features: {} } satisfies AppConfig,
    })

    const { result } = renderHookWithQuery(() => useAppConfig())
    await vi.waitFor(() => expect(result.current.preset).toBe('ecommerce'))

    expect(result.current.isEcommerce).toBe(true)
  })

  it('defaults features to an empty object before data resolves', () => {
    mocks.get.mockReturnValueOnce(new Promise(() => {}))

    const { result } = renderHookWithQuery(() => useAppConfig())

    expect(result.current.config).toBeUndefined()
    expect(result.current.features).toEqual({})
    expect(result.current.isEcommerce).toBe(false)
  })

  it('isModuleEnabled reflects the ecommerce preset and generic feature flags', async () => {
    mocks.get.mockResolvedValueOnce({
      data: { preset: 'ecommerce', features: { media: true } } satisfies AppConfig,
    })

    const { result } = renderHookWithQuery(() => useAppConfig())
    await vi.waitFor(() => expect(result.current.config).toBeDefined())

    expect(result.current.isModuleEnabled('ecommerce')).toBe(true) // preset-gated
    expect(result.current.isModuleEnabled('media')).toBe(true) // generic features[] fallback
    expect(result.current.isModuleEnabled('unknown')).toBe(false)
  })

  it('isModuleEnabled treats ecommerce as disabled under a basic preset', async () => {
    mocks.get.mockResolvedValueOnce({
      data: { preset: 'basic', features: {} } satisfies AppConfig,
    })

    const { result } = renderHookWithQuery(() => useAppConfig())
    await vi.waitFor(() => expect(result.current.config).toBeDefined())

    expect(result.current.isModuleEnabled('ecommerce')).toBe(false)
  })

  it('ensureModuleEnabled fetches the config once and evaluates the module for the guard', async () => {
    mocks.get.mockResolvedValueOnce({
      data: { preset: 'ecommerce', features: {} } satisfies AppConfig,
    })
    const queryClient = createTestQueryClient()

    expect(await ensureModuleEnabled(queryClient, 'ecommerce')).toBe(true)
    // Cached — a second call must not refetch.
    expect(await ensureModuleEnabled(queryClient, 'ecommerce')).toBe(true)
    expect(mocks.get).toHaveBeenCalledTimes(1)
  })

  it('ensureModuleEnabled reports a disabled module under a basic preset', async () => {
    mocks.get.mockResolvedValueOnce({
      data: { preset: 'basic', features: {} } satisfies AppConfig,
    })

    expect(await ensureModuleEnabled(createTestQueryClient(), 'ecommerce')).toBe(false)
  })
})
