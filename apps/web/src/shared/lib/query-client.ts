import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/lib/http'

/**
 * The single app-wide QueryClient. Provided in `main.tsx` and passed to the router context; never
 * construct another one. Server state — including the session user — lives here.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Never retry client errors (4xx) — they won't succeed on retry.
        if (isApiError(error)) {
          const status = error.response?.status ?? 0
          if (status >= 400 && status < 500) return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
