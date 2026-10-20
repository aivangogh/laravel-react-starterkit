import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GeneralSettings } from '@app/types'
import { renderHookWithQuery } from '@/test/utils'
import { settingsKeys } from '@/shared/lib/query-keys'
import { useSettings, useUpdateSettings } from '@/features/settings/hooks/useSettings'

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

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
  })

  it('fetches general settings from GET /api/settings', async () => {
    mocks.get.mockResolvedValueOnce({ data: settings })

    const { result } = renderHookWithQuery(() => useSettings())

    await vi.waitFor(() => expect(result.current.data).toEqual(settings))
    expect(mocks.get).toHaveBeenCalledWith('/api/settings')
  })

  it('updates via PUT /api/settings and invalidates the detail key', async () => {
    const updated: GeneralSettings = {
      ...settings,
      app_name: 'Renamed',
      registration_enabled: false,
    }
    mocks.put.mockResolvedValueOnce({ data: updated })

    const { result, queryClient } = renderHookWithQuery(() => useUpdateSettings())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    const payload = {
      app_name: 'Renamed',
      support_email: 'help@example.com',
      registration_enabled: false,
    }
    const returned = await result.current.mutateAsync(payload)

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.put).toHaveBeenCalledWith('/api/settings', payload)
    expect(returned).toEqual(updated)
    expect(queryClient.getQueryData(settingsKeys.detail())).toEqual(updated)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: settingsKeys.detail() })
  })
})
