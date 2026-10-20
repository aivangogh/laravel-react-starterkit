import { createRootRouteWithContext, Navigate, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Button } from '@app/ui/components/ui/button'
import { getErrorMessage } from '@/shared/lib/http'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div className="bg-background text-foreground min-h-screen antialiased">
      <Outlet />
    </div>
  ),
  // Unknown paths go home (the `_app` guard then sends logged-out visitors to /login).
  notFoundComponent: () => <Navigate to="/" replace />,
  // Last-resort boundary, e.g. the API is unreachable while resolving the session.
  errorComponent: ({ error, reset }) => (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </main>
  ),
})
