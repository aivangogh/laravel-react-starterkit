import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { authKeys } from '@/shared/lib/query-keys'
import { useProfile } from '@/features/profile/composables/useProfile'

// Hoisted mocks referenced by the `vi.mock` factory.
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
}))

const fakeUser = { id: 'u1', name: 'Ada', email: 'ada@example.com' }

/** Mount the composable in a throwaway app with Pinia + VueQueryPlugin, returning the spied client. */
function withSetup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

  let result!: ReturnType<typeof useProfile>
  const app = createApp({
    setup() {
      result = useProfile()
      return () => null
    },
  })
  app.use(createPinia())
  app.use(VueQueryPlugin, { queryClient })
  app.mount(document.createElement('div'))

  return { result, queryClient, invalidateSpy, app }
}

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
    const { result, invalidateSpy } = withSetup()

    await result.updateProfileMutation.mutateAsync({ name: 'Ada', email: 'ada@example.com' })

    expect(mocks.ensureCsrfCookie).toHaveBeenCalled()
    expect(mocks.put).toHaveBeenCalledWith('/api/profile', {
      name: 'Ada',
      email: 'ada@example.com',
    })
    // fetchUser (auth store) re-runs, then the auth query is invalidated.
    await vi.waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith('/api/user')
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: authKeys.user() })
    })
  })

  it('updatePassword PUTs /api/profile/password without touching the session', async () => {
    const { result, invalidateSpy } = withSetup()

    await result.updatePasswordMutation.mutateAsync({
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
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('uploadAvatar POSTs multipart to /api/profile/avatar and refreshes the session', async () => {
    const { result, invalidateSpy } = withSetup()
    const file = new File(['x'], 'me.png', { type: 'image/png' })

    await result.uploadAvatarMutation.mutateAsync(file)

    expect(mocks.post).toHaveBeenCalledWith('/api/profile/avatar', expect.any(FormData))
    const sentForm = mocks.post.mock.calls[0][1] as FormData
    expect(sentForm.get('avatar')).toBe(file)
    await vi.waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: authKeys.user() })
    })
  })

  it('removeAvatar DELETEs /api/profile/avatar and refreshes the session', async () => {
    const { result, invalidateSpy } = withSetup()

    await result.removeAvatarMutation.mutateAsync()

    expect(mocks.delete).toHaveBeenCalledWith('/api/profile/avatar')
    await vi.waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: authKeys.user() })
    })
  })
})
