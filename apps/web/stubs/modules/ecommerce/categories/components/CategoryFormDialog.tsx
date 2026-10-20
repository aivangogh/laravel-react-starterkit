import { useState, type FormEvent } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/ui/dialog'
import { Input } from '@app/ui/components/ui/input'
import { Textarea } from '@app/ui/components/ui/textarea'
import { FormField } from '@/shared/components/FormField'
import { formErrors } from '@/shared/lib/form'
import type { Category } from '../../types'
import { useCreateCategory, useUpdateCategory } from '../hooks/useCategories'

/**
 * Create/edit dialog for a category. The body (mutations + form) lives inside `DialogContent`, which
 * Base UI unmounts while closed — so every open starts with fresh fields and no stale errors.
 */
export function CategoryFormDialog({
  open,
  onOpenChange,
  category = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <CategoryFormDialogBody category={category} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Owns the write flow: runs the create or update mutation, closes on success, and surfaces server
 * errors — field-level 422s render inline, anything else shows as a top-level alert. The slug is
 * derived server-side from the name.
 */
function CategoryFormDialogBody({
  category,
  onClose,
}: {
  category: Category | null
  onClose: () => void
}) {
  const isEdit = category != null
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const mutation = isEdit ? updateCategory : createCategory
  const errors = formErrors(mutation.error)
  const pending = mutation.isPending

  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const payload = { name, description: description ? description : null }
    if (category) {
      updateCategory.mutate({ id: category.id, ...payload }, { onSuccess: onClose })
    } else {
      createCategory.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update this category’s details.' : 'Add a category to the catalog.'}
        </DialogDescription>
      </DialogHeader>

      {errors.alert && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{errors.alert}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <FormField label="Name" htmlFor="category-form-name" error={errors.fields.name}>
          <Input
            id="category-form-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.fields.name || undefined}
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor="category-form-description"
          error={errors.fields.description}
        >
          <Textarea
            id="category-form-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            aria-invalid={!!errors.fields.description || undefined}
          />
        </FormField>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </form>
    </>
  )
}
