import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook } from '@testing-library/react'

/** A fresh, non-retrying QueryClient per test. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function wrapperFor(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

/** Run a hook inside a QueryClientProvider (`useQuery`/`useMutation`/`useQueryClient` work). */
export function renderHookWithQuery<T>(hook: () => T, queryClient = createTestQueryClient()) {
  return { ...renderHook(hook, { wrapper: wrapperFor(queryClient) }), queryClient }
}

/** Render a component inside a QueryClientProvider. */
export function renderWithQuery(ui: ReactNode, queryClient = createTestQueryClient()) {
  return { ...render(ui, { wrapper: wrapperFor(queryClient) }), queryClient }
}
