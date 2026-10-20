import { createRouter } from '@tanstack/react-router'
import { queryClient } from '@/shared/lib/query-client'
import { routeTree } from '@/routeTree.gen'
import '@/shared/router/types'

/**
 * The app router. Routes are files under `src/routes/` (the Vite plugin generates `routeTree.gen.ts`);
 * the shared `queryClient` rides in the router context so guards and loaders can prefetch with the
 * same cache the components read.
 */
export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  // Let TanStack Query own freshness; the router just re-runs loaders on navigation.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
