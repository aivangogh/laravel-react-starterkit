<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@app/ui/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import { getErrorMessage } from '@/shared/lib/http'
import { useDeleteRole, type RoleRow } from '@/features/roles/composables/useRoles'

/**
 * Confirmation modal for deleting a role. Runs the delete mutation on confirm and only closes on
 * success (a failure — e.g. the role is still assigned — is surfaced inline and keeps the dialog
 * open). Guarding of protected roles happens upstream in the row actions; this is the last check.
 */
const props = withDefaults(defineProps<{ role?: RoleRow | null }>(), { role: null })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ deleted: [] }>()

const deleteMutation = useDeleteRole()
const errorMessage = computed(() =>
  deleteMutation.isError.value ? getErrorMessage(deleteMutation.error.value) : '',
)

function confirmDelete(): void {
  if (!props.role) return
  deleteMutation.mutate(props.role.id, {
    onSuccess: () => {
      emit('deleted')
      open.value = false
    },
  })
}

// Reset the mutation's error whenever the dialog is dismissed so it doesn't leak into the next open.
function onOpenChange(next: boolean): void {
  open.value = next
  if (!next) deleteMutation.reset()
}
</script>

<template>
  <AlertDialog :open="open" @update:open="onOpenChange">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete role</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes the
          <span class="text-foreground font-medium">{{ props.role?.name }}</span> role. Users
          assigned to it will lose the permissions it granted. This cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <Alert v-if="errorMessage" variant="destructive">
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="deleteMutation.isPending.value">Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          :disabled="deleteMutation.isPending.value"
          @click="confirmDelete"
        >
          <LoaderCircle v-if="deleteMutation.isPending.value" class="size-4 animate-spin" />
          Delete role
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
