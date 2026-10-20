import type { User } from '@app/types'
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
import { useDeleteUser } from '@/features/users/hooks/useUsers'

/**
 * Confirm-and-delete dialog. The destructive action is a plain button (not `AlertDialogAction`) so
 * the dialog stays open on failure to show the error; on success we close it explicitly. The body is
 * remounted on every open, so a previous error never lingers.
 */
export function DeleteUserDialog({
  open,
  onOpenChange,
  user = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <DeleteUserDialogBody user={user} onClose={() => onOpenChange(false)} />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteUserDialogBody({ user, onClose }: { user: User | null; onClose: () => void }) {
  const deleteUser = useDeleteUser()

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete user</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes <span className="text-foreground font-medium">{user?.name}</span>{' '}
          and cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      {deleteUser.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(deleteUser.error)}</AlertDescription>
        </Alert>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          disabled={deleteUser.isPending}
          onClick={() => user && deleteUser.mutate(user.id, { onSuccess: onClose })}
        >
          Delete
        </Button>
      </AlertDialogFooter>
    </>
  )
}
