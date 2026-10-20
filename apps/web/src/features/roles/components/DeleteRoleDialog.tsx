import { LoaderCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@app/ui/components/ui/alert-dialog'
import { Button } from '@app/ui/components/ui/button'
import { getErrorMessage } from '@/shared/lib/http'
import { useDeleteRole, type RoleRow } from '@/features/roles/hooks/useRoles'

/**
 * Confirmation modal for deleting a role. Runs the delete mutation on confirm and only closes on
 * success (a failure — e.g. the role is still assigned — is surfaced inline and keeps the dialog
 * open). Guarding of protected roles happens upstream in the row actions; this is the last check.
 * The body is remounted on every open, so a previous error never lingers.
 */
export function DeleteRoleDialog({
  open,
  onOpenChange,
  role = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleRow | null
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <DeleteRoleDialogBody role={role} onClose={() => onOpenChange(false)} />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteRoleDialogBody({ role, onClose }: { role: RoleRow | null; onClose: () => void }) {
  const deleteRole = useDeleteRole()

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete role</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes the{' '}
          <span className="text-foreground font-medium">{role?.name}</span> role. Users assigned to
          it will lose the permissions it granted. This cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      {deleteRole.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(deleteRole.error)}</AlertDescription>
        </Alert>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={deleteRole.isPending}>Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          disabled={deleteRole.isPending}
          onClick={() => role && deleteRole.mutate(role.id, { onSuccess: onClose })}
        >
          {deleteRole.isPending && <LoaderCircle className="size-4 animate-spin" />}
          Delete role
        </Button>
      </AlertDialogFooter>
    </>
  )
}
