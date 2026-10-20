import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'

const searchSchema = v.object({
  token: v.fallback(v.string(), ''),
  email: v.fallback(v.string(), ''),
})

export const Route = createFileRoute('/_guest/reset-password')({
  validateSearch: searchSchema,
  component: function ResetPasswordRoute() {
    const { token, email } = Route.useSearch()
    return <ResetPasswordPage token={token} email={email} />
  },
})
