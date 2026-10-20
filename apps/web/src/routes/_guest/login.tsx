import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'
import { LoginPage } from '@/features/auth/pages/LoginPage'

const searchSchema = v.object({
  // Only same-origin paths are honoured (`/x`, not `//evil.com` or `https://…`) — no open redirect.
  // Anything else is dropped rather than failing the page.
  redirect: v.fallback(
    v.optional(v.pipe(v.string(), v.regex(/^\/(?!\/)/, 'must be an in-app path'))),
    undefined,
  ),
})

export const Route = createFileRoute('/_guest/login')({
  validateSearch: searchSchema,
  component: function LoginRoute() {
    return <LoginPage redirect={Route.useSearch().redirect} />
  },
})
