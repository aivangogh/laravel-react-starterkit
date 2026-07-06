<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'
import {
  useCategoryOptions,
  useCreateProduct,
  useUpdateProduct,
} from '../composables/useProducts'
import { majorToMinor, minorToMajorNumber } from '../lib/money'
import type { Product } from '../../types'

/**
 * Create/edit dialog for a product. Owns the write flow: runs the create or update mutation, closes
 * on success, and surfaces server errors — field-level 422s render inline, anything else shows as a
 * top-level alert. Price is edited in MAJOR units and converted to integer minor units on submit.
 */
const props = withDefaults(defineProps<{ open: boolean; product?: Product | null }>(), {
  product: null,
})
const emit = defineEmits<{ 'update:open': [value: boolean]; saved: [] }>()

const open = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const isEdit = computed(() => props.product != null)

// Fetch the category catalogue only while the dialog is open.
const categoriesQuery = useCategoryOptions(open)
const categories = computed(() => categoriesQuery.data.value ?? [])

const createProduct = useCreateProduct()
const updateProduct = useUpdateProduct()
const pending = computed(() => createProduct.isPending.value || updateProduct.isPending.value)

// Field state (price/stock held as strings for the numeric inputs).
const name = ref('')
const price = ref('')
const categoryId = ref('')
const description = ref('')
const stock = ref('0')
const isActive = ref(true)

const fieldErrors = ref<Record<string, string[]>>({})
const generalError = ref('')

function hydrate(): void {
  const product = props.product
  name.value = product?.name ?? ''
  price.value = product ? String(minorToMajorNumber(product.price)) : ''
  categoryId.value = product?.category_id ?? ''
  description.value = product?.description ?? ''
  stock.value = product ? String(product.stock) : '0'
  isActive.value = product?.is_active ?? true
}

// Reset fields + errors each time the dialog opens (reka-ui unmounts the content while closed).
watch(open, (value) => {
  if (value) {
    fieldErrors.value = {}
    generalError.value = ''
    hydrate()
  }
})

function fieldError(field: string): string | undefined {
  return fieldErrors.value[field]?.[0]
}

async function handleSubmit(): Promise<void> {
  fieldErrors.value = {}
  generalError.value = ''
  const payload = {
    name: name.value,
    price: majorToMinor(Number(price.value)),
    category_id: categoryId.value,
    description: description.value ? description.value : null,
    stock: Number(stock.value),
    is_active: isActive.value,
  }
  try {
    if (props.product) {
      await updateProduct.mutateAsync({ id: props.product.id, ...payload })
    } else {
      await createProduct.mutateAsync(payload)
    }
    emit('saved')
    open.value = false
  } catch (error) {
    fieldErrors.value = getValidationErrors(error)
    // Only show the generic banner when there are no field-level messages to render.
    generalError.value = Object.keys(fieldErrors.value).length ? '' : getErrorMessage(error)
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Edit product' : 'New product' }}</DialogTitle>
        <DialogDescription>
          {{
            isEdit
              ? 'Update this product’s catalog details.'
              : 'Add a product to the catalog.'
          }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="generalError" variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{{ generalError }}</AlertDescription>
      </Alert>

      <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="product-form-name">Name</Label>
          <Input
            id="product-form-name"
            v-model="name"
            :aria-invalid="fieldError('name') ? true : undefined"
          />
          <p v-if="fieldError('name')" class="text-destructive text-sm">
            {{ fieldError('name') }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="product-form-price">Price</Label>
            <Input
              id="product-form-price"
              v-model="price"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              :aria-invalid="fieldError('price') ? true : undefined"
            />
            <p v-if="fieldError('price')" class="text-destructive text-sm">
              {{ fieldError('price') }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="product-form-stock">Stock</Label>
            <Input
              id="product-form-stock"
              v-model="stock"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
              :aria-invalid="fieldError('stock') ? true : undefined"
            />
            <p v-if="fieldError('stock')" class="text-destructive text-sm">
              {{ fieldError('stock') }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="product-form-category">Category</Label>
          <Select v-model="categoryId">
            <SelectTrigger
              id="product-form-category"
              class="w-full"
              :aria-invalid="fieldError('category_id') ? true : undefined"
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="categoriesQuery.isLoading.value" class="text-muted-foreground text-sm">
            Loading categories…
          </p>
          <p v-else-if="categoriesQuery.isError.value" class="text-muted-foreground text-sm">
            Categories are unavailable right now.
          </p>
          <p v-else-if="!categories.length" class="text-muted-foreground text-sm">
            No categories available. Create a category first.
          </p>
          <p v-if="fieldError('category_id')" class="text-destructive text-sm">
            {{ fieldError('category_id') }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="product-form-description">Description</Label>
          <Textarea
            id="product-form-description"
            v-model="description"
            rows="3"
            :aria-invalid="fieldError('description') ? true : undefined"
          />
          <p v-if="fieldError('description')" class="text-destructive text-sm">
            {{ fieldError('description') }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <Switch id="product-form-active" v-model="isActive" />
          <Label for="product-form-active" class="font-normal">Active</Label>
        </div>

        <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" :disabled="pending" @click="open = false">
            Cancel
          </Button>
          <Button type="submit" :disabled="pending">
            {{ isEdit ? 'Save changes' : 'Create product' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
