import type { User } from '@app/types'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/ui/dialog'
import { formErrors } from '@/shared/lib/form'
import { useCreateUser, useRoleOptions, useUpdateUser } from '@/features/users/hooks/useUsers'
import { UserForm, type UserFormValues } from '@/features/users/components/UserForm'

/**
 * Create/edit dialog. The body (mutations + form) lives inside `DialogContent`, which Base UI
 * unmounts while closed — so every open starts with fresh fields and no stale errors.
 */
export function UserFormDialog({
  open,
  onOpenChange,
  user = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <UserFormDialogBody user={user} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Owns the write flow: runs the create or update mutation, closes on success, and surfaces server
 * errors — field-level 422s pass down to `UserForm`, anything else shows as a top-level alert.
 */
function UserFormDialogBody({ user, onClose }: { user: User | null; onClose: () => void }) {
  const isEdit = user != null
  // Mounted only while open, so the role catalogue is fetched only when needed.
  const rolesQuery = useRoleOptions()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const mutation = isEdit ? updateUser : createUser
  const errors = formErrors(mutation.error)

  function handleSubmit(values: UserFormValues) {
    if (user) {
      updateUser.mutate(
        {
          id: user.id,
          name: values.name,
          email: values.email,
          roles: values.roles,
          // Omit the password entirely when left blank — the API keeps the current one.
          ...(values.password ? { password: values.password } : {}),
        },
        { onSuccess: onClose },
      )
    } else {
      createUser.mutate(values, { onSuccess: onClose })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit user' : 'New user'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update this user’s details and role assignments.'
            : 'Create a user account and assign roles.'}
        </DialogDescription>
      </DialogHeader>

      {errors.alert && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{errors.alert}</AlertDescription>
        </Alert>
      )}

      <UserForm
        user={user}
        roles={rolesQuery.data ?? []}
        rolesLoading={rolesQuery.isLoading}
        rolesError={rolesQuery.isError}
        errors={errors.fields}
        pending={mutation.isPending}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </>
  )
}
