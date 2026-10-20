import { createFileRoute, redirect } from '@tanstack/react-router'
import { userQueryOptions } from '@/features/auth/hooks/useAuth'
import { ensureModuleEnabled } from '@/shared/hooks/useAppConfig'
import { DashboardLayout } from '@/shared/layouts/DashboardLayout'
import { can } from '@/shared/lib/permissions'

/**
 * The authenticated app shell and THE single guard for every page under `_app/` — auth, install
 * module and permission gating. Pages don't add their own `beforeLoad`; they declare intent via
 * `staticData` (`permission`, `module`), which this guard reads from every matched route. It runs on
 * each navigation, so moving between pages re-checks the destination.
 */
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context: { queryClient }, location, matches }) => {
    const user = await queryClient.ensureQueryData(userQueryOptions)
    if (!user) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }

    for (const { staticData } of matches) {
      // Checked before `permission` so a disabled module reads as "not installed" (home) rather
      // than "forbidden".
      if (staticData.module && !(await ensureModuleEnabled(queryClient, staticData.module))) {
        throw redirect({ to: '/' })
      }
      if (staticData.permission && !can(user, staticData.permission)) {
        throw redirect({ to: '/forbidden' })
      }
    }

    return { user }
  },
  component: DashboardLayout,
})
