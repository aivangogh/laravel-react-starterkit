import { beforeAll, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { Sidebar, SidebarContent, SidebarProvider } from '@app/ui/components/ui/sidebar'
import { AppSidebarNav } from '@/shared/components/AppSidebarNav'

// Fixed nav set — mocked so the test controls exactly which items render, independent of the real
// route tree / permissions (those are covered by useNavItems.spec). `users` carries an icon to
// exercise the icon branch.
vi.mock('@/shared/hooks/useNavItems', () => ({
  useNavItems: () => [
    { to: '/', title: 'Home', order: 1 },
    { to: '/users', title: 'Users', order: 2, icon: () => <svg data-testid="users-icon" /> },
  ],
}))

// The shadcn `SidebarProvider` reads `matchMedia`; jsdom ships none, so stub it to "desktop" (not
// mobile) — that's the variant the E2E `sidebar()` helper targets. The router's scroll handling
// calls `scrollTo`, which jsdom doesn't implement either.
beforeAll(() => {
  vi.stubGlobal('scrollTo', () => {})
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  )
})

/** A two-route memory router whose root renders the nav inside the shadcn sidebar. */
function makeRouter() {
  const rootRoute = createRootRoute({
    component: () => (
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarContent>
            <AppSidebarNav />
          </SidebarContent>
        </Sidebar>
        <Outlet />
      </SidebarProvider>
    ),
  })
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: '/' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/users' }),
  ])
  return createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
}

async function renderNav() {
  const router = makeRouter()
  const { container } = render(<RouterProvider router={router} />)
  await screen.findByText('Home')
  return { router, container }
}

/** Title → whether its `[data-sidebar="menu-button"]` is marked active. */
function activeByTitle(container: HTMLElement) {
  return Object.fromEntries(
    [...container.querySelectorAll('[data-sidebar="menu-button"]')].map((button) => [
      button.textContent?.trim(),
      button.hasAttribute('data-active'),
    ]),
  )
}

describe('AppSidebarNav', () => {
  it('renders one link per nav item inside the shadcn sidebar root', async () => {
    const { container } = await renderNav()

    // `[data-slot="sidebar"]` is exactly what the E2E `sidebar()` helper locates.
    const sidebar = container.querySelector<HTMLElement>('[data-slot="sidebar"]')
    expect(sidebar).not.toBeNull()

    const links = within(sidebar!).getAllByRole('link')
    expect(links.map((a) => a.textContent)).toEqual(['Home', 'Users'])
    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
  })

  it('marks the current route active and the others inactive', async () => {
    const { container } = await renderNav()

    expect(activeByTitle(container)).toEqual({ Home: true, Users: false })
  })

  it('reflects a route change in the active item', async () => {
    const { router, container } = await renderNav()

    await act(() => router.navigate({ to: '/users' }))

    expect(activeByTitle(container)).toEqual({ Home: false, Users: true })
  })
})
