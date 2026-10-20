import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHookWithQuery } from '@/test/utils'
import {
  useRemoveAvatar,
  useUpdatePassword,
  useUpdateProfile,
  useUploadAvatar,
} from '@/features/profile/hooks/useProfile'

// Hoisted mock handles so they exist when `vi.mock`'s factory runs.
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
  ensureCsrfCookie: vi.fn(),
}))

vi.mock('@/shared/lib/http', () => ({
  http: { get: mocks.get, put: mocks.put, post: mocks.post, delete: mocks.delete },
  ensureCsrfCookie: mocks.ensureCsrfCookie,
  isApiError: () => false,
}))

const fakeUser = { id: 'u1', name: 'Ada', email: 'ada@example.com' }

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.ensureCsrfCookie.mockResolvedValue(undefined)
    mocks.get.mockResolvedValue({ data: fakeUser })
    mocks.put.mockResolvedValue({ data: fakeUser })
    mocks.post.mockResolvedValue({ data: fakeUser })
    mocks.delete.mockResolvedValue({ data: null })
  })

  it('updateProfile PUTs /api/profile and refreshes the session', async () => {
    const { result } = renderHookWithQuery(() => useUpdateProfile())

    await result.current.mutateAsync({ name: 'Ada', email: 'ada@example.com' })

    expect(mocks.ensureCsrfCookie).toHaveBeenCalled()
    expect(mocks.put).toHaveBeenCalledWith('/api/profile', {
      name: 'Ada',
      email: 'ada@example.com',
    })
    // The session user query is refetched.
    expect(mocks.get).toHaveBeenCalledWith('/api/user')
  })

  it('updatePassword PUTs /api/profile/password without touching the session', async () => {
    const { result } = renderHookWithQuery(() => useUpdatePassword())

    await result.current.mutateAsync({
      current_password: 'old-secret',
      password: 'new-secret',
      password_confirmation: 'new-secret',
    })

    expect(mocks.put).toHaveBeenCalledWith('/api/profile/password', {
      current_password: 'old-secret',
      password: 'new-secret',
      password_confirmation: 'new-secret',
    })
    expect(mocks.get).not.toHaveBeenCalledWith('/api/user')
  })

  it('uploadAvatar POSTs multipart to /api/profile/avatar and refreshes the session', async () => {
    const { result } = renderHookWithQuery(() => useUploadAvatar())
    const file = new File(['x'], 'me.png', { type: 'image/png' })

    await result.current.mutateAsync(file)

    expect(mocks.post).toHaveBeenCalledWith('/api/profile/avatar', expect.any(FormData))
    const sentForm = mocks.post.mock.calls[0][1] as FormData
    expect(sentForm.get('avatar')).toBe(file)
    expect(mocks.get).toHaveBeenCalledWith('/api/user')
  })

  it('removeAvatar DELETEs /api/profile/avatar and refreshes the session', async () => {
    const { result } = renderHookWithQuery(() => useRemoveAvatar())

    await result.current.mutateAsync()

    expect(mocks.delete).toHaveBeenCalledWith('/api/profile/avatar')
    expect(mocks.get).toHaveBeenCalledWith('/api/user')
  })
})
