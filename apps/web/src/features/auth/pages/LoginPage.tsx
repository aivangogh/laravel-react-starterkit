import type { FormEvent } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
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
import { useLogin } from '@/features/auth/hooks/useAuth'

/** `redirect` is the validated in-app path to return to after sign-in (see `routes/_guest/login.tsx`). */
export function LoginPage({ redirect }: { redirect?: string }) {
  const router = useRouter()
  const navigate = useNavigate()
  const login = useLogin()
  const errors = formErrors(login.error)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { email, password } = formValues(event.currentTarget)
    login.mutate(
      { email, password },
      {
        onSuccess: () => void (redirect ? router.history.push(redirect) : navigate({ to: '/' })),
      },
    )
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
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
                required
                aria-invalid={!!errors.fields.email || undefined}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              error={errors.fields.password}
              labelAside={
                <Link
                  to="/forgot-password"
                  className="text-muted-foreground text-sm underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              }
            >
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-invalid={!!errors.fields.password || undefined}
              />
            </FormField>
          </CardContent>

          <CardFooter className="mt-6 flex-col gap-4">
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-foreground underline-offset-4 hover:underline">
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}
