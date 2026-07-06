<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import { useDeleteCategory } from '../composables/useCategories'
import type { Category } from '../../types'

/**
 * Confirm-and-delete dialog. The destructive action is a plain button (not `AlertDialogAction`) so
 * the dialog stays open on failure to show the error; on success we close it explicitly.
 */
const props = withDefaults(defineProps<{ open: boolean; category?: Category | null }>(), {
  category: null,
})
const emit = defineEmits<{ 'update:open': [value: boolean]; deleted: [] }>()

const open = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const deleteCategory = useDeleteCategory()
const errorMessage = ref('')

watch(open, (value) => {
  if (value) errorMessage.value = ''
})

async function confirmDelete() {
  if (!props.category) return
  errorMessage.value = ''
  try {
    await deleteCategory.mutateAsync(props.category.id)
    emit('deleted')
    open.value = false
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete category</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes
          <span class="text-foreground font-medium">{{ category?.name }}</span> and cannot be
          undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <Alert v-if="errorMessage" variant="destructive">
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="deleteCategory.isPending.value">Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          :disabled="deleteCategory.isPending.value"
          @click="confirmDelete"
        >
          Delete
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
