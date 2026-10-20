import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { userQueryOptions } from '@/features/auth/hooks/useAuth'

/** Public auth pages (login/register/password reset) — for logged-out visitors only. */
export const Route = createFileRoute('/_guest')({
  beforeLoad: async ({ context: { queryClient } }) => {
    if (await queryClient.ensureQueryData(userQueryOptions)) {
      throw redirect({ to: '/' })
    }
  },
  component: Outlet,
})
