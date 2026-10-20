import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'

export const Route = createFileRoute('/_guest/forgot-password')({
  component: ForgotPasswordPage,
})
