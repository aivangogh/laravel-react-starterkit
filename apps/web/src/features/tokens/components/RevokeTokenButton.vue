<script setup lang="ts">
import { ref } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import type { ApiToken } from '@app/types'
import { Button } from '@app/ui/components/ui/button'
import { buttonVariants } from '@app/ui/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@app/ui/components/ui/alert-dialog'

const props = defineProps<{
  token: ApiToken
  /** Performs the revoke; returns a promise so the button can show a pending state. */
  confirm: (id: number) => Promise<unknown>
}>()

const open = ref(false)
const pending = ref(false)

async function onConfirm() {
  pending.value = true
  try {
    await props.confirm(props.token.id)
    open.value = false
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogTrigger as-child>
      <Button variant="ghost" size="icon-sm" :aria-label="`Revoke ${token.name}`">
        <Trash2 class="size-4" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Revoke this token?</AlertDialogTitle>
        <AlertDialogDescription>
          Any application using <span class="font-medium">{{ token.name }}</span> will immediately
          lose access. This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="pending">Cancel</AlertDialogCancel>
        <AlertDialogAction
          :class="buttonVariants({ variant: 'destructive' })"
          :disabled="pending"
          @click.prevent="onConfirm"
        >
          {{ pending ? 'Revoking…' : 'Revoke' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
