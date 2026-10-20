import type { FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
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
import { useForgotPassword } from '@/features/auth/hooks/useAuth'

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword()
  const errors = formErrors(forgotPassword.error)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    forgotPassword.mutate({ email: formValues(event.currentTarget).email })
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>Enter your email and we'll send a reset link.</CardDescription>
        </CardHeader>
        <form noValidate onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {forgotPassword.isSuccess && (
              <Alert>
                <AlertDescription>
                  {forgotPassword.data?.message ??
                    'If that email exists, a reset link is on its way.'}
                </AlertDescription>
              </Alert>
            )}
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
                required
                aria-invalid={!!errors.fields.email || undefined}
              />
            </FormField>
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-4">
            <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending ? 'Sending…' : 'Send reset link'}
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
