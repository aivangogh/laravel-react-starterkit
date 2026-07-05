<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { User } from '@app/types'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/ui/dialog'
import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'
import { useCreateUser, useRoleOptions, useUpdateUser } from '@/features/users/composables/useUsers'
import UserForm from '@/features/users/components/UserForm.vue'

/**
 * Create/edit dialog. Owns the write flow: runs the create or update mutation, closes on success,
 * and surfaces server errors — field-level 422s pass down to `UserForm`, anything else shows as a
 * top-level alert. `UserForm` is remounted on each open (reka-ui unmounts closed content), so its
 * fields always start fresh.
 */
const props = withDefaults(defineProps<{ open: boolean; user?: User | null }>(), { user: null })
const emit = defineEmits<{ 'update:open': [value: boolean]; saved: [] }>()

const open = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const isEdit = computed(() => props.user != null)

// Fetch the role catalogue only while the dialog is open.
const rolesQuery = useRoleOptions(open)
const roles = computed(() => rolesQuery.data.value ?? [])

const createUser = useCreateUser()
const updateUser = useUpdateUser()
const pending = computed(() => createUser.isPending.value || updateUser.isPending.value)

const fieldErrors = ref<Record<string, string[]>>({})
const generalError = ref('')

// Clear any surfaced errors each time the dialog opens.
watch(open, (value) => {
  if (value) {
    fieldErrors.value = {}
    generalError.value = ''
  }
})

async function handleSubmit(payload: {
  name: string
  email: string
  password: string
  roles: string[]
}) {
  fieldErrors.value = {}
  generalError.value = ''
  try {
    if (props.user) {
      await updateUser.mutateAsync({
        id: props.user.id,
        name: payload.name,
        email: payload.email,
        roles: payload.roles,
        // Omit the password entirely when left blank — the API keeps the current one.
        ...(payload.password ? { password: payload.password } : {}),
      })
    } else {
      await createUser.mutateAsync(payload)
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
        <DialogTitle>{{ isEdit ? 'Edit user' : 'New user' }}</DialogTitle>
        <DialogDescription>
          {{
            isEdit
              ? 'Update this user’s details and role assignments.'
              : 'Create a user account and assign roles.'
          }}
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="generalError" variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{{ generalError }}</AlertDescription>
      </Alert>

      <UserForm
        :user="props.user"
        :roles="roles"
        :roles-loading="rolesQuery.isLoading.value"
        :roles-error="rolesQuery.isError.value"
        :errors="fieldErrors"
        :pending="pending"
        @submit="handleSubmit"
        @cancel="open = false"
      />
    </DialogContent>
  </Dialog>
</template>
