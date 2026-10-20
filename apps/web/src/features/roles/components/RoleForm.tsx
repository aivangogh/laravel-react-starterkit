import { useState, type FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import { Input } from '@app/ui/components/ui/input'
import { FormField } from '@/shared/components/FormField'
import { formErrors } from '@/shared/lib/form'
import {
  useCreateRole,
  usePermissionCatalogue,
  useUpdateRole,
  type RoleRow,
} from '@/features/roles/hooks/useRoles'
import { PermissionMatrix } from '@/features/roles/components/PermissionMatrix'

/**
 * The create/edit role form body (no dialog chrome — `RoleFormDialog` wraps it). Owns the
 * name + permission-matrix state and the create/update mutations, and surfaces 422 field errors
 * inline. Calls `onSaved` after a successful write and `onCancel` when dismissed. Fields are
 * initialised from `role` on mount; the dialog remounts the form on every open.
 */
export function RoleForm({
  role = null,
  onSaved,
  onCancel,
}: {
  role?: RoleRow | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(role?.name ?? '')
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? [])

  const catalogue = usePermissionCatalogue()
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()

  const isEdit = role != null
  const mutation = isEdit ? updateMutation : createMutation
  const errors = formErrors(mutation.error)
  // Laravel keys array errors as `permissions` and/or `permissions.0`, `permissions.1`, …
  const permissionErrorKey = Object.keys(errors.fields).find(
    (k) => k === 'permissions' || k.startsWith('permissions.'),
  )
  const permissionError = permissionErrorKey ? errors.fields[permissionErrorKey] : ''

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const payload = { name, permissions }
    if (role) updateMutation.mutate({ id: role.id, payload }, { onSuccess: onSaved })
    else createMutation.mutate(payload, { onSuccess: onSaved })
  }

  return (
    <form noValidate className="space-y-5" onSubmit={handleSubmit}>
      {errors.alert && (
        <Alert variant="destructive">
          <AlertDescription>{errors.alert}</AlertDescription>
        </Alert>
      )}

      <FormField label="Name" htmlFor="role-name" error={errors.fields.name}>
        <Input
          id="role-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          placeholder="e.g. editor"
          required
          aria-invalid={!!errors.fields.name || undefined}
        />
      </FormField>

      <FormField
        label="Permissions"
        error={permissionError}
        labelAside={
          <span className="text-muted-foreground text-xs">{permissions.length} selected</span>
        }
      >
        <PermissionMatrix
          permissions={catalogue.data ?? []}
          value={permissions}
          onChange={setPermissions}
          loading={catalogue.isPending}
          invalid={!!permissionError}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <LoaderCircle className="size-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Create role'}
        </Button>
      </div>
    </form>
  )
}
