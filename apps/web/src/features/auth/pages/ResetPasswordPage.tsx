import type { FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@app/ui/components/ui/card'
import { Input } from '@app/ui/components/ui/input'
import { FormField } from '@/shared/components/FormField'
import { AuthLayout } from '@/shared/layouts/AuthLayout'
import { formErrors, formValues } from '@/shared/lib/form'
import { useResetPassword } from '@/features/auth/hooks/useAuth'

/** Fortify reset links carry `token` and `email` in the query string (validated by the route). */
export function ResetPasswordPage({ token, email }: { token: string; email: string }) {
  const navigate = useNavigate()
  const resetPassword = useResetPassword()
  const errors = formErrors(resetPassword.error)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = formValues(event.currentTarget)
    resetPassword.mutate(
      {
        token,
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
      },
      { onSuccess: () => void navigate({ to: '/login' }) },
    )
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <form noValidate onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {errors.alert && (
              <Alert variant="destructive">
                <AlertDescription>{errors.alert}</AlertDescription>
              </Alert>
            )}

            <FormField label="Email" htmlFor="email" error={errors.fields.email}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                defaultValue={email}
                required
                aria-invalid={!!errors.fields.email || undefined}
              />
            </FormField>

            <FormField label="New password" htmlFor="password" error={errors.fields.password}>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={!!errors.fields.password || undefined}
              />
            </FormField>

            <FormField label="Confirm new password" htmlFor="password_confirmation">
              <Input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
              />
            </FormField>
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-4">
            <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}
