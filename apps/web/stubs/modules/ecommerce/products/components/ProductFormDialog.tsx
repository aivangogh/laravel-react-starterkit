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
import { Label } from '@app/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@app/ui/components/ui/select'
import { Switch } from '@app/ui/components/ui/switch'
import { Textarea } from '@app/ui/components/ui/textarea'
import { FormField } from '@/shared/components/FormField'
import { formErrors } from '@/shared/lib/form'
import type { Product } from '../../types'
import { majorToMinor, minorToMajorNumber } from '../../lib/money'
import { useCategoryOptions, useCreateProduct, useUpdateProduct } from '../hooks/useProducts'

/**
 * Create/edit dialog for a product. The body (mutations + form) lives inside `DialogContent`, which
 * Base UI unmounts while closed — so every open starts with fresh fields and no stale errors.
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  product = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <ProductFormDialogBody product={product} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Owns the write flow: runs the create or update mutation, closes on success, and surfaces server
 * errors — field-level 422s render inline, anything else shows as a top-level alert. Price is edited
 * in MAJOR units and converted to integer minor units on submit.
 */
function ProductFormDialogBody({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  const isEdit = product != null
  // Mounted only while open, so the category catalogue is fetched only when needed.
  const categoriesQuery = useCategoryOptions()
  const categories = categoriesQuery.data ?? []
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const mutation = isEdit ? updateProduct : createProduct
  const errors = formErrors(mutation.error)
  const pending = mutation.isPending

  // Field state (price/stock held as strings for the numeric inputs).
  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(product ? String(minorToMajorNumber(product.price)) : '')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const payload = {
      name,
      price: majorToMinor(Number(price)),
      category_id: categoryId,
      description: description ? description : null,
      stock: Number(stock),
      is_active: isActive,
    }
    if (product) {
      updateProduct.mutate({ id: product.id, ...payload }, { onSuccess: onClose })
    } else {
      createProduct.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit product' : 'New product'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update this product’s catalog details.' : 'Add a product to the catalog.'}
        </DialogDescription>
      </DialogHeader>

      {errors.alert && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{errors.alert}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <FormField label="Name" htmlFor="product-form-name" error={errors.fields.name}>
          <Input
            id="product-form-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.fields.name || undefined}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Price" htmlFor="product-form-price" error={errors.fields.price}>
            <Input
              id="product-form-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              aria-invalid={!!errors.fields.price || undefined}
            />
          </FormField>

          <FormField label="Stock" htmlFor="product-form-stock" error={errors.fields.stock}>
            <Input
              id="product-form-stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              aria-invalid={!!errors.fields.stock || undefined}
            />
          </FormField>
        </div>

        <FormField
          label="Category"
          htmlFor="product-form-category"
          error={errors.fields.category_id}
          hint={
            categoriesQuery.isLoading
              ? 'Loading categories…'
              : categoriesQuery.isError
                ? 'Categories are unavailable right now.'
                : !categories.length
                  ? 'No categories available. Create a category first.'
                  : undefined
          }
        >
          <Select
            value={categoryId || null}
            onValueChange={(value) => setCategoryId(value ?? '')}
            // Lets `SelectValue` show the category name instead of its UUID.
            items={categories.map((category) => ({ value: category.id, label: category.name }))}
          >
            <SelectTrigger
              id="product-form-category"
              className="w-full"
              aria-invalid={!!errors.fields.category_id || undefined}
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Description"
          htmlFor="product-form-description"
          error={errors.fields.description}
        >
          <Textarea
            id="product-form-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            aria-invalid={!!errors.fields.description || undefined}
          />
        </FormField>

        <div className="flex items-center gap-2">
          <Switch id="product-form-active" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="product-form-active" className="font-normal">
            Active
          </Label>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </form>
    </>
  )
}
