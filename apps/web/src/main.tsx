import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { TooltipProvider } from '@app/ui/components/ui/tooltip'
import { authKeys } from '@/shared/lib/query-keys'
import { http, isApiError, resetCsrfCookie } from '@/shared/lib/http'
import { queryClient } from '@/shared/lib/query-client'
import { router } from '@/router'
import '@/assets/main.css'

// Session expiry mid-app: a 401 from any request drops the cached user and re-runs the route guards,
// which send the visitor to /login. A 419 means the CSRF token rotated — re-prime it on the next write.
http.interceptors.response.use(undefined, (error) => {
  const status = isApiError(error) ? error.response?.status : undefined
  if (status === 419) resetCsrfCookie()
  if (status === 401 && queryClient.getQueryData(authKeys.user())) {
    queryClient.clear()
    queryClient.setQueryData(authKeys.user(), null)
    void router.invalidate()
  }
  return Promise.reject(error)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
