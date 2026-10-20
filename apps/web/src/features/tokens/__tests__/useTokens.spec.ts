import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiToken, NewApiToken, Paginated } from '@app/types'
import { tableKeys } from '@/shared/lib/query-keys'
import { renderHookWithQuery } from '@/test/utils'
import { useTokens } from '@/features/tokens/hooks/useTokens'

// Hoisted mock handles so they exist when `vi.mock`'s factory runs.
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get, post: mocks.post, delete: mocks.del },
  ensureCsrfCookie: mocks.ensureCsrfCookie,
}))

const emptyPage: Paginated<ApiToken> = {
  data: [],
  meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
}

const newToken: NewApiToken = {
  id: 7,
  name: 'CI deploy',
  abilities: ['*'],
  last_used_at: null,
  expires_at: null,
  created_at: '2026-01-01T00:00:00Z' as NewApiToken['created_at'],
  plain_text_token: '7|super-secret-plaintext-value',
}

describe('useTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
    mocks.get.mockResolvedValue({ data: emptyPage })
  })

  it('lists tokens from GET /api/tokens with the standard table params', async () => {
    renderHookWithQuery(() => useTokens())

    await vi.waitFor(() =>
      expect(mocks.get).toHaveBeenCalledWith('/api/tokens', {
        params: { page: 1, per_page: 10 },
      }),
    )
  })

  it('creates a token, returns the one-time plain_text_token, and invalidates the list', async () => {
    mocks.post.mockResolvedValueOnce({ data: newToken })
    const { result, queryClient } = renderHookWithQuery(() => useTokens())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const returned = await result.current.createMutation.mutateAsync({ name: 'CI deploy' })

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.post).toHaveBeenCalledWith('/api/tokens', {
      name: 'CI deploy',
      abilities: undefined,
    })
    expect(returned.plain_text_token).toBe('7|super-secret-plaintext-value')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tableKeys.list('tokens') })
  })

  it('revokes a token via DELETE /api/tokens/{id} and invalidates the list', async () => {
    mocks.del.mockResolvedValueOnce({ data: null })
    const { result, queryClient } = renderHookWithQuery(() => useTokens())
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await result.current.revokeMutation.mutateAsync(7)

    expect(mocks.ensureCsrfCookie).toHaveBeenCalledTimes(1)
    expect(mocks.del).toHaveBeenCalledWith('/api/tokens/7')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tableKeys.list('tokens') })
  })
})
