import type { FormEvent } from 'react'
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
import { formErrors, formValues } from '@/shared/lib/form'
import { useUpdatePassword } from '@/features/profile/hooks/useProfile'

/** Change-password form. The fields are cleared after a successful update. */
export function ProfilePasswordForm() {
  const updatePassword = useUpdatePassword()
  const errors = formErrors(updatePassword.error)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const { current_password, password, password_confirmation } = formValues(form)
    updatePassword.mutate(
      { current_password, password, password_confirmation },
      { onSuccess: () => form.reset() },
    )
  }

  return (
    <Card data-slot="profile-password-form">
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Choose a strong password you don't use elsewhere.</CardDescription>
      </CardHeader>
      <form noValidate onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {errors.alert && (
            <Alert variant="destructive">
              <AlertDescription>{errors.alert}</AlertDescription>
            </Alert>
          )}

          {updatePassword.isSuccess && (
            <p className="text-muted-foreground text-sm" role="status">
              Password updated.
            </p>
          )}

          <FormField
            label="Current password"
            htmlFor="current-password"
            error={errors.fields.current_password}
          >
            <Input
              id="current-password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={!!errors.fields.current_password || undefined}
            />
          </FormField>

          <FormField label="New password" htmlFor="new-password" error={errors.fields.password}>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={!!errors.fields.password || undefined}
            />
          </FormField>

          <FormField label="Confirm new password" htmlFor="confirm-password">
            <Input
              id="confirm-password"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
            />
          </FormField>
        </CardContent>

        <CardFooter className="mt-6">
          <Button type="submit" disabled={updatePassword.isPending}>
            {updatePassword.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
