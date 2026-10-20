import { useState, type FormEvent } from 'react'
import type { Role, User } from '@app/types'
import { Button } from '@app/ui/components/ui/button'
import { Checkbox } from '@app/ui/components/ui/checkbox'
import { Input } from '@app/ui/components/ui/input'
import { Label } from '@app/ui/components/ui/label'
import { FormField } from '@/shared/components/FormField'

export interface UserFormValues {
  name: string
  email: string
  password: string
  roles: string[]
}

/**
 * Presentational create/edit form for a user. It owns only its field state and reports the collected
 * values on submit — the parent dialog runs the mutation and feeds server 422s back via `errors`.
 * Kept free of any router/query/http coupling so it can be unit-tested in isolation. Fields are
 * initialised from `user` on mount; the dialog remounts the form on every open.
 */
export function UserForm({
  user = null,
  roles = [],
  rolesLoading = false,
  rolesError = false,
  errors = {},
  pending = false,
  onSubmit,
  onCancel,
}: {
  /** Present → edit mode: fields are pre-filled and the password is optional. */
  user?: User | null
  /** Role catalogue for the assignment checkboxes. */
  roles?: Role[]
  rolesLoading?: boolean
  rolesError?: boolean
  /** First server validation message per field (from a 422 body). */
  errors?: Record<string, string>
  /** A write is in flight — disables the actions. */
  pending?: boolean
  onSubmit: (values: UserFormValues) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles ?? [])

  const isEdit = user != null
  // `roles` array errors can surface under `roles` or `roles.<index>`.
  const rolesErrorKey = Object.keys(errors).find((k) => k === 'roles' || k.startsWith('roles.'))

  function toggleRole(role: string, checked: boolean): void {
    setSelectedRoles((current) =>
      checked ? [...new Set([...current, role])] : current.filter((r) => r !== role),
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    onSubmit({ name, email, password, roles: selectedRoles })
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      <FormField label="Name" htmlFor="user-form-name" error={errors.name}>
        <Input
          id="user-form-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          aria-invalid={!!errors.name || undefined}
        />
      </FormField>

      <FormField label="Email" htmlFor="user-form-email" error={errors.email}>
        <Input
          id="user-form-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-invalid={!!errors.email || undefined}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="user-form-password"
        error={errors.password}
        hint={isEdit ? 'Leave blank to keep the current password.' : undefined}
      >
        <Input
          id="user-form-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          aria-invalid={!!errors.password || undefined}
        />
      </FormField>

      <FormField label="Roles" error={rolesErrorKey && errors[rolesErrorKey]}>
        {rolesLoading ? (
          <p className="text-muted-foreground text-sm">Loading roles…</p>
        ) : rolesError ? (
          <p className="text-muted-foreground text-sm">Roles are unavailable right now.</p>
        ) : !roles.length ? (
          <p className="text-muted-foreground text-sm">No roles available.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center gap-2">
                <Checkbox
                  id={`user-form-role-${role.id}`}
                  checked={selectedRoles.includes(role.name)}
                  onCheckedChange={(checked) => toggleRole(role.name, checked)}
                />
                <Label htmlFor={`user-form-role-${role.id}`} className="font-normal capitalize">
                  {role.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </FormField>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {isEdit ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}
