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
import type { Product } from '../../types'
import { useDeleteProduct } from '../hooks/useProducts'

/**
 * Confirm-and-delete dialog. The destructive action is a plain button (not `AlertDialogAction`) so
 * the dialog stays open on failure to show the error; on success we close it explicitly. The body is
 * remounted on every open, so a previous error never lingers.
 */
export function DeleteProductDialog({
  open,
  onOpenChange,
  product = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <DeleteProductDialogBody product={product} onClose={() => onOpenChange(false)} />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteProductDialogBody({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  const deleteProduct = useDeleteProduct()

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete product</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes{' '}
          <span className="text-foreground font-medium">{product?.name}</span> and cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      {deleteProduct.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getErrorMessage(deleteProduct.error)}</AlertDescription>
        </Alert>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={deleteProduct.isPending}>Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          disabled={deleteProduct.isPending}
          onClick={() => product && deleteProduct.mutate(product.id, { onSuccess: onClose })}
        >
          Delete
        </Button>
      </AlertDialogFooter>
    </>
  )
}
