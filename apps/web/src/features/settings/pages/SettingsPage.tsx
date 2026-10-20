import { useState, type FormEvent } from 'react'
import type { GeneralSettings } from '@app/types'
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
import { Label } from '@app/ui/components/ui/label'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { Switch } from '@app/ui/components/ui/switch'
import { FormField } from '@/shared/components/FormField'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { formErrors } from '@/shared/lib/form'
import { useSettings, useUpdateSettings } from '@/features/settings/hooks/useSettings'

function toForm(data: GeneralSettings | undefined) {
  return {
    app_name: data?.app_name ?? '',
    support_email: data?.support_email ?? '',
    registration_enabled: data?.registration_enabled ?? false,
  }
}

export function SettingsPage() {
  const { can } = usePermissions()
  const settings = useSettings()
  const updateSettings = useUpdateSettings()
  const errors = formErrors(updateSettings.error)

  // `settings.update` gates the whole form: without it the inputs are read-only and Save is hidden.
  const canUpdate = can('settings.update')

  // Hydrate the form from the server copy whenever it loads or is refetched.
  const [form, setForm] = useState(() => toForm(settings.data))
  const [hydratedFrom, setHydratedFrom] = useState(settings.data)
  if (settings.data !== hydratedFrom) {
    setHydratedFrom(settings.data)
    setForm(toForm(settings.data))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canUpdate) return
    updateSettings.mutate({
      app_name: form.app_name,
      // An empty email field clears the value rather than sending a blank string.
      support_email: form.support_email.trim() === '' ? null : form.support_email,
      registration_enabled: form.registration_enabled,
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage application-wide general settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>These settings apply across the whole application.</CardDescription>
        </CardHeader>

        {settings.isLoading ? (
          // Loading skeleton while the initial settings query resolves.
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-6 w-40" />
          </CardContent>
        ) : (
          <form noValidate onSubmit={onSubmit}>
            <CardContent className="space-y-6">
              {errors.alert ? (
                <Alert variant="destructive">
                  <AlertDescription>{errors.alert}</AlertDescription>
                </Alert>
              ) : (
                updateSettings.isSuccess && (
                  <Alert>
                    <AlertDescription>Your changes have been saved.</AlertDescription>
                  </Alert>
                )
              )}

              <FormField label="Application name" htmlFor="app_name" error={errors.fields.app_name}>
                <Input
                  id="app_name"
                  value={form.app_name}
                  onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                  disabled={!canUpdate}
                  placeholder="My Application"
                  required
                  aria-invalid={!!errors.fields.app_name || undefined}
                />
              </FormField>

              <FormField
                label="Support email"
                htmlFor="support_email"
                error={errors.fields.support_email}
              >
                <Input
                  id="support_email"
                  type="email"
                  value={form.support_email}
                  onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                  disabled={!canUpdate}
                  placeholder="support@example.com"
                  aria-invalid={!!errors.fields.support_email || undefined}
                />
              </FormField>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="registration_enabled">Registration enabled</Label>
                  <p className="text-muted-foreground text-sm">
                    Allow new users to create an account.
                  </p>
                </div>
                <Switch
                  id="registration_enabled"
                  checked={form.registration_enabled}
                  onCheckedChange={(checked) => setForm({ ...form, registration_enabled: checked })}
                  disabled={!canUpdate}
                  aria-label="Registration enabled"
                />
              </div>
            </CardContent>

            {canUpdate && (
              <CardFooter className="mt-6">
                <Button type="submit" disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </CardFooter>
            )}
          </form>
        )}
      </Card>
    </div>
  )
}
