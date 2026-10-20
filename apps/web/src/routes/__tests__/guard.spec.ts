import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from '@tanstack/react-router'
import type { AppConfig, User } from '@app/types'
import { routeTree } from '@/routeTree.gen'
import { Route as AppRoute } from '@/routes/_app'
import { authKeys, configKeys } from '@/shared/lib/query-keys'
import { createTestQueryClient } from '@/test/utils'

// Stub only the transport; the session/config are seeded into the cache per test.
const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/shared/lib/http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/http')>()),
  http: { get: mocks.get },
}))

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    name: 'Ada',
    email: 'ada@example.com',
    email_verified_at: null,
    avatar_url: null,
    roles: [],
    permissions: [],
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as unknown as User
}

const basicConfig: AppConfig = { preset: 'basic', features: {} }

/**
 * Build the real app router at `path` with the session (`undefined` = not cached, so the guard
 * fetches it) and config seeded, run the guards, and return where navigation settled.
 */
async function navigate(path: string, user?: User | null) {
  const queryClient = createTestQueryClient()
  if (user !== undefined) queryClient.setQueryData(authKeys.user(), user)
  queryClient.setQueryData(configKeys.detail(), basicConfig)

  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  await router.load()
  // A guard that threw a real error (not a redirect) would leave the location untouched — fail loudly.
  expect(router.state.matches.filter((match) => match.status === 'error')).toEqual([])
  return router.state.location
}

describe('route guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects a logged-out visitor off an app route to login, preserving the path', async () => {
    const location = await navigate('/users?page=2', null)

    expect(location.pathname).toBe('/login')
    expect(location.search).toEqual({ redirect: '/users?page=2' })
  })

  it('redirects a user lacking the route permission to /forbidden', async () => {
    const location = await navigate('/users', makeUser({ permissions: ['roles.view'] }))

    expect(location.pathname).toBe('/forbidden')
  })

  it('allows a user who holds the route permission', async () => {
    const location = await navigate('/users', makeUser({ permissions: ['users.view'] }))

    expect(location.pathname).toBe('/users')
  })

  it('lets super-admin through without explicit permissions', async () => {
    const location = await navigate('/users', makeUser({ roles: ['super-admin'] }))

    expect(location.pathname).toBe('/users')
  })

  it('sends a logged-in user away from guest-only routes', async () => {
    const location = await navigate('/login', makeUser())

    expect(location.pathname).toBe('/')
  })

  it('lets a logged-out visitor reach guest-only routes', async () => {
    const location = await navigate('/login', null)

    expect(location.pathname).toBe('/login')
  })

  it('resolves the session before deciding when it is not cached yet', async () => {
    mocks.get.mockResolvedValueOnce({ data: makeUser() })

    const location = await navigate('/')

    expect(mocks.get).toHaveBeenCalledWith('/api/user')
    expect(location.pathname).toBe('/')
  })
})

/**
 * The basic route tree has no module-gated route, so the module branch is exercised by calling
 * the `_app` guard directly with fake matches.
 */
describe('_app guard: install modules', () => {
  async function runGuard(config: AppConfig, user = makeUser({ roles: ['super-admin'] })) {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(authKeys.user(), user)
    queryClient.setQueryData(configKeys.detail(), config)
    const beforeLoad = AppRoute.options.beforeLoad as unknown as (ctx: unknown) => Promise<unknown>

    try {
      return await beforeLoad({
        context: { queryClient },
        location: { href: '/shop' },
        matches: [{ staticData: {} }, { staticData: { module: 'ecommerce' } }],
      })
    } catch (thrown) {
      // `redirect()` throws a Response carrying the target in `options`.
      return thrown
    }
  }

  it('redirects home when the route belongs to a disabled install module', async () => {
    const result = await runGuard(basicConfig)

    expect(result).toMatchObject({ options: { to: '/' } })
  })

  it('allows a route whose install module is enabled', async () => {
    const user = makeUser({ roles: ['super-admin'] })
    const result = await runGuard({ preset: 'ecommerce', features: {} }, user)

    expect(result).toEqual({ user })
  })
})
