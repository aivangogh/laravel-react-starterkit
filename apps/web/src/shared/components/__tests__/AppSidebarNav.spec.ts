import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
} from '@app/ui/components/ui/sidebar'
import AppSidebarNav from '@/shared/components/AppSidebarNav.vue'

// Fixed nav set — mocked so the test controls exactly which items render, independent of the real
// route registry / permissions (those are covered by useNavItems.spec). `users` carries an icon to
// exercise the icon branch. Async factory so we can hand back a real `ref` (a plain object wouldn't
// unwrap under the template's `v-for`).
vi.mock('@/shared/composables/useNavItems', async () => {
  const { ref, h: hh, markRaw } = await import('vue')
  // markRaw: keep the icon component out of the reactive proxy (mirrors real route-meta icons).
  const StubIcon = markRaw({ name: 'StubIcon', render: () => hh('svg') })
  const items = ref([
    { name: 'home', title: 'Home', order: 1 },
    { name: 'users', title: 'Users', order: 2, icon: StubIcon },
  ])
  return { useNavItems: () => ({ items }) }
})

const Blank = { render: () => h('div') }

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Blank },
      { path: '/users', name: 'users', component: Blank },
    ],
  })
}

// The shadcn `SidebarProvider` calls `useMediaQuery`; jsdom ships no `matchMedia`, so stub it to
// "desktop" (not mobile) — that's the variant the E2E `sidebar()` helper targets.
beforeAll(() => {
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

async function mountNav(router: Router) {
  const wrapper = mount(
    {
      components: { SidebarProvider, Sidebar, SidebarContent, AppSidebarNav },
      template: `
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarContent><AppSidebarNav /></SidebarContent>
          </Sidebar>
        </SidebarProvider>
      `,
    },
    { global: { plugins: [router] } },
  )
  await router.isReady()
  await wrapper.vm.$nextTick()
  return wrapper
}

describe('AppSidebarNav', () => {
  let router: Router

  beforeEach(async () => {
    router = makeRouter()
    await router.push({ name: 'home' })
  })

  it('renders one link per nav item inside the shadcn sidebar root', async () => {
    const wrapper = await mountNav(router)

    // `[data-slot="sidebar"]` is exactly what the E2E `sidebar()` helper locates.
    const sidebar = wrapper.find('[data-slot="sidebar"]')
    expect(sidebar.exists()).toBe(true)

    const links = sidebar.findAll('a')
    expect(links.map((a) => a.text())).toEqual(['Home', 'Users'])
  })

  it('marks the current route active and the others inactive', async () => {
    const wrapper = await mountNav(router)

    const buttons = wrapper.findAll('[data-sidebar="menu-button"]')
    const active = Object.fromEntries(
      buttons.map((b) => [b.text().trim(), b.attributes('data-active')]),
    )
    expect(active.Home).toBe('true')
    expect(active.Users).toBe('false')
  })

  it('reflects a route change in the active item', async () => {
    const wrapper = await mountNav(router)

    await router.push({ name: 'users' })
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('[data-sidebar="menu-button"]')
    const active = Object.fromEntries(
      buttons.map((b) => [b.text().trim(), b.attributes('data-active')]),
    )
    expect(active.Home).toBe('false')
    expect(active.Users).toBe('true')
  })
})
