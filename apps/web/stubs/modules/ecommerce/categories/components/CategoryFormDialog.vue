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
import { Textarea } from '@app/ui/components/ui/textarea'
import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'
import { useCreateCategory, useUpdateCategory } from '../composables/useCategories'
import type { Category } from '../../types'

/**
 * Create/edit dialog for a category. Owns the write flow: runs the create or update mutation, closes
 * on success, and surfaces server errors — field-level 422s render inline, anything else shows as a
 * top-level alert. The slug is derived server-side from the name.
 */
const props = withDefaults(defineProps<{ open: boolean; category?: Category | null }>(), {
  category: null,
})
const emit = defineEmits<{ 'update:open': [value: boolean]; saved: [] }>()

const open = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const isEdit = computed(() => props.category != null)

const createCategory = useCreateCategory()
const updateCategory = useUpdateCategory()
const pending = computed(() => createCategory.isPending.value || updateCategory.isPending.value)

const name = ref('')
const description = ref('')

const fieldErrors = ref<Record<string, string[]>>({})
const generalError = ref('')

function hydrate(): void {
  name.value = props.category?.name ?? ''
  description.value = props.category?.description ?? ''
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
    description: description.value ? description.value : null,
  }
  try {
    if (props.category) {
      await updateCategory.mutateAsync({ id: props.category.id, ...payload })
    } else {
      await createCategory.mutateAsync(payload)
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
        <DialogTitle>{{ isEdit ? 'Edit category' : 'New category' }}</DialogTitle>
        <DialogDescription>
          {{ isEdit ? 'Update this category’s details.' : 'Add a category to the catalog.' }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="generalError" variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{{ generalError }}</AlertDescription>
      </Alert>

      <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="category-form-name">Name</Label>
          <Input
            id="category-form-name"
            v-model="name"
            :aria-invalid="fieldError('name') ? true : undefined"
          />
          <p v-if="fieldError('name')" class="text-destructive text-sm">
            {{ fieldError('name') }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="category-form-description">Description</Label>
          <Textarea
            id="category-form-description"
            v-model="description"
            rows="3"
            :aria-invalid="fieldError('description') ? true : undefined"
          />
          <p v-if="fieldError('description')" class="text-destructive text-sm">
            {{ fieldError('description') }}
          </p>
        </div>

        <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" :disabled="pending" @click="open = false">
            Cancel
          </Button>
          <Button type="submit" :disabled="pending">
            {{ isEdit ? 'Save changes' : 'Create category' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
