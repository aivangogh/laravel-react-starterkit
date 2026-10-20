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
import { useRegister } from '@/features/auth/hooks/useAuth'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()
  const errors = formErrors(register.error)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { name, email, password, password_confirmation } = formValues(event.currentTarget)
    register.mutate(
      { name, email, password, password_confirmation },
      { onSuccess: () => void navigate({ to: '/' }) },
    )
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Sign up to get started.</CardDescription>
        </CardHeader>
        <form noValidate onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {errors.alert && (
              <Alert variant="destructive">
                <AlertDescription>{errors.alert}</AlertDescription>
              </Alert>
            )}

            <FormField label="Name" htmlFor="name" error={errors.fields.name}>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                required
                aria-invalid={!!errors.fields.name || undefined}
              />
            </FormField>

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

            <FormField label="Password" htmlFor="password" error={errors.fields.password}>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={!!errors.fields.password || undefined}
              />
            </FormField>

            <FormField label="Confirm password" htmlFor="password_confirmation">
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
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}
