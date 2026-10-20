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
import type { Category } from '../../types'
import { useDeleteCategory } from '../hooks/useCategories'

/**
 * Confirm-and-delete dialog. The destructive action is a plain button (not `AlertDialogAction`) so
 * the dialog stays open on failure to show the error; on success we close it explicitly. The body is
 * remounted on every open, so a previous error never lingers.
 */
export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <DeleteCategoryDialogBody category={category} onClose={() => onOpenChange(false)} />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteCategoryDialogBody({
  category,
  onClose,
}: {
  category: Category | null
  onClose: () => void
}) {
  const deleteCategory = useDeleteCategory()

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete category</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes{' '}
          <span className="text-foreground font-medium">{category?.name}</span> and cannot be
          undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      {deleteCategory.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(deleteCategory.error)}</AlertDescription>
        </Alert>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={deleteCategory.isPending}>Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          disabled={deleteCategory.isPending}
          onClick={() => category && deleteCategory.mutate(category.id, { onSuccess: onClose })}
        >
          Delete
        </Button>
      </AlertDialogFooter>
    </>
  )
}
