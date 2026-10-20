import { useState, type FormEvent } from 'react'
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
import { formErrors } from '@/shared/lib/form'
import { useUser } from '@/features/auth/hooks/useAuth'
import { useUpdateProfile } from '@/features/profile/hooks/useProfile'

/** Name/email form, pre-filled from the session user (already resolved by the route guard). */
export function ProfileInfoForm() {
  const user = useUser()
  const updateProfile = useUpdateProfile()
  const errors = formErrors(updateProfile.error)

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateProfile.mutate({ name, email })
  }

  return (
    <Card data-slot="profile-info-form">
      <CardHeader>
        <CardTitle>Profile information</CardTitle>
        <CardDescription>Update your name and email address.</CardDescription>
      </CardHeader>
      <form noValidate onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {errors.alert && (
            <Alert variant="destructive">
              <AlertDescription>{errors.alert}</AlertDescription>
            </Alert>
          )}

          {updateProfile.isSuccess && (
            <p className="text-muted-foreground text-sm" role="status">
              Saved.
            </p>
          )}

          <FormField label="Name" htmlFor="profile-name" error={errors.fields.name}>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              aria-invalid={!!errors.fields.name || undefined}
            />
          </FormField>

          <FormField label="Email" htmlFor="profile-email" error={errors.fields.email}>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-invalid={!!errors.fields.email || undefined}
            />
          </FormField>
        </CardContent>

        <CardFooter className="mt-6">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
