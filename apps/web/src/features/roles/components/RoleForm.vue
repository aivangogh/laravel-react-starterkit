<script setup lang="ts">
import { computed, reactive } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import { Input } from '@app/ui/components/ui/input'
import { Label } from '@app/ui/components/ui/label'
import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'
import {
  useCreateRole,
  usePermissionCatalogue,
  useUpdateRole,
  type RoleRow,
} from '@/features/roles/composables/useRoles'
import PermissionMatrix from '@/features/roles/components/PermissionMatrix.vue'

/**
 * The create/edit role form body (no dialog chrome — {@link RoleFormDialog} wraps it). Owns the
 * name + permission-matrix state and the create/update mutations, and surfaces 422 field errors
 * inline. Emits `saved` on a successful write and `cancel` when dismissed.
 */
const props = withDefaults(defineProps<{ role?: RoleRow | null }>(), { role: null })
const emit = defineEmits<{ saved: []; cancel: [] }>()

const isEdit = computed(() => props.role != null)

const form = reactive<{ name: string; permissions: string[] }>({
  name: props.role?.name ?? '',
  permissions: [...(props.role?.permissions ?? [])],
})

const catalogue = usePermissionCatalogue()
const createMutation = useCreateRole()
const updateMutation = useUpdateRole()

const activeMutation = computed(() => (isEdit.value ? updateMutation : createMutation))
const isPending = computed(() => activeMutation.value.isPending.value)

const fieldErrors = computed(() => getValidationErrors(activeMutation.value.error.value))
const errorMessage = computed(() =>
  activeMutation.value.isError.value ? getErrorMessage(activeMutation.value.error.value) : '',
)
// Laravel keys array errors as `permissions` and/or `permissions.0`, `permissions.1`, …
const permissionError = computed(() => {
  const errors = fieldErrors.value
  const key = Object.keys(errors).find((k) => k === 'permissions' || k.startsWith('permissions.'))
  return key ? errors[key][0] : ''
})

function onSubmit(): void {
  const payload = { name: form.name, permissions: [...form.permissions] }
  const onSuccess = () => emit('saved')

  if (isEdit.value && props.role) {
    updateMutation.mutate({ id: props.role.id, payload }, { onSuccess })
  } else {
    createMutation.mutate(payload, { onSuccess })
  }
}
</script>

<template>
  <form novalidate class="space-y-5" @submit.prevent="onSubmit">
    <Alert v-if="errorMessage && Object.keys(fieldErrors).length === 0" variant="destructive">
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="space-y-2">
      <Label for="role-name">Name</Label>
      <Input
        id="role-name"
        v-model="form.name"
        type="text"
        autocomplete="off"
        placeholder="e.g. editor"
        required
        :aria-invalid="Boolean(fieldErrors.name)"
      />
      <p v-if="fieldErrors.name" class="text-destructive text-sm">{{ fieldErrors.name[0] }}</p>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <Label>Permissions</Label>
        <span class="text-muted-foreground text-xs">{{ form.permissions.length }} selected</span>
      </div>
      <PermissionMatrix
        v-model="form.permissions"
        :permissions="catalogue.data.value ?? []"
        :loading="catalogue.isPending.value"
        :invalid="Boolean(permissionError)"
      />
      <p v-if="permissionError" class="text-destructive text-sm">{{ permissionError }}</p>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" :disabled="isPending" @click="emit('cancel')">
        Cancel
      </Button>
      <Button type="submit" :disabled="isPending">
        <LoaderCircle v-if="isPending" class="size-4 animate-spin" />
        {{ isEdit ? 'Save changes' : 'Create role' }}
      </Button>
    </div>
  </form>
</template>
