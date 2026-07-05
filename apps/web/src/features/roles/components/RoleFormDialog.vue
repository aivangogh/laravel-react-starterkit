<script setup lang="ts">
import { computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/ui/dialog'
import type { RoleRow } from '@/features/roles/composables/useRoles'
import RoleForm from '@/features/roles/components/RoleForm.vue'

/**
 * Modal host for the create/edit role form. Thin shell: it owns open/close (`v-model:open`) and
 * the header copy, and delegates all form state + mutations to {@link RoleForm}. Re-keying the
 * form by role id guarantees a clean slate whenever the target changes without closing.
 */
const props = withDefaults(defineProps<{ role?: RoleRow | null }>(), { role: null })
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ saved: [] }>()

const isEdit = computed(() => props.role != null)

function onSaved(): void {
  emit('saved')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Edit role' : 'New role' }}</DialogTitle>
        <DialogDescription> Name the role and choose the permissions it grants. </DialogDescription>
      </DialogHeader>

      <RoleForm
        :key="props.role?.id ?? 'new'"
        :role="props.role"
        @saved="onSaved"
        @cancel="open = false"
      />
    </DialogContent>
  </Dialog>
</template>
