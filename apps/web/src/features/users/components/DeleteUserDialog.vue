<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import { useDeleteUser } from '@/features/users/composables/useUsers'

/**
 * Confirm-and-delete dialog. The destructive action is a plain button (not `AlertDialogAction`) so
 * the dialog stays open on failure to show the error; on success we close it explicitly.
 */
const props = withDefaults(defineProps<{ open: boolean; user?: User | null }>(), { user: null })
const emit = defineEmits<{ 'update:open': [value: boolean]; deleted: [] }>()

const open = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const deleteUser = useDeleteUser()
const errorMessage = ref('')

watch(open, (value) => {
  if (value) errorMessage.value = ''
})

async function confirmDelete() {
  if (!props.user) return
  errorMessage.value = ''
  try {
    await deleteUser.mutateAsync(props.user.id)
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
        <AlertDialogTitle>Delete user</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes
          <span class="text-foreground font-medium">{{ user?.name }}</span> and cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <Alert v-if="errorMessage" variant="destructive">
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="deleteUser.isPending.value">Cancel</AlertDialogCancel>
        <Button variant="destructive" :disabled="deleteUser.isPending.value" @click="confirmDelete">
          Delete
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
