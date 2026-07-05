<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Role, User } from '@app/types'
import { Button } from '@app/ui/components/ui/button'
import { Checkbox } from '@app/ui/components/ui/checkbox'
import { Input } from '@app/ui/components/ui/input'
import { Label } from '@app/ui/components/ui/label'

/**
 * Presentational create/edit form for a user. It owns only its field state and emits the collected
 * values on submit — the parent dialog runs the mutation and feeds server 422s back via `errors`.
 * Kept free of any router/query/http coupling so it can be unit-tested in isolation.
 */
interface Props {
  /** Present → edit mode: fields are pre-filled and the password is optional. */
  user?: User | null
  /** Role catalogue for the assignment checkboxes. */
  roles?: Role[]
  rolesLoading?: boolean
  rolesError?: boolean
  /** Server validation errors keyed by field name (from a 422 body). */
  errors?: Record<string, string[]>
  /** A write is in flight — disables the actions. */
  pending?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  roles: () => [],
  rolesLoading: false,
  rolesError: false,
  errors: () => ({}),
  pending: false,
})

const emit = defineEmits<{
  submit: [payload: { name: string; email: string; password: string; roles: string[] }]
  cancel: []
}>()

const name = ref('')
const email = ref('')
const password = ref('')
const selectedRoles = ref<string[]>([])

const isEdit = computed(() => props.user != null)

// (Re)hydrate the fields whenever the target user changes — including the initial mount.
watch(
  () => props.user,
  (user) => {
    name.value = user?.name ?? ''
    email.value = user?.email ?? ''
    password.value = ''
    selectedRoles.value = [...(user?.roles ?? [])]
  },
  { immediate: true },
)

function fieldError(field: string): string | undefined {
  return props.errors[field]?.[0]
}

// `roles` array errors can surface under `roles` or `roles.<index>`.
const rolesFieldError = computed(() => {
  const key = Object.keys(props.errors).find((k) => k === 'roles' || k.startsWith('roles.'))
  return key ? props.errors[key]?.[0] : undefined
})

function toggleRole(role: string, checked: boolean | 'indeterminate'): void {
  if (checked) {
    if (!selectedRoles.value.includes(role)) selectedRoles.value = [...selectedRoles.value, role]
  } else {
    selectedRoles.value = selectedRoles.value.filter((r) => r !== role)
  }
}

function onSubmit(): void {
  emit('submit', {
    name: name.value,
    email: email.value,
    password: password.value,
    roles: [...selectedRoles.value],
  })
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="onSubmit">
    <div class="space-y-2">
      <Label for="user-form-name">Name</Label>
      <Input
        id="user-form-name"
        v-model="name"
        autocomplete="name"
        :aria-invalid="fieldError('name') ? true : undefined"
      />
      <p v-if="fieldError('name')" class="text-destructive text-sm">{{ fieldError('name') }}</p>
    </div>

    <div class="space-y-2">
      <Label for="user-form-email">Email</Label>
      <Input
        id="user-form-email"
        v-model="email"
        type="email"
        autocomplete="email"
        :aria-invalid="fieldError('email') ? true : undefined"
      />
      <p v-if="fieldError('email')" class="text-destructive text-sm">{{ fieldError('email') }}</p>
    </div>

    <div class="space-y-2">
      <Label for="user-form-password">Password</Label>
      <Input
        id="user-form-password"
        v-model="password"
        type="password"
        autocomplete="new-password"
        :aria-invalid="fieldError('password') ? true : undefined"
      />
      <p v-if="isEdit" class="text-muted-foreground text-sm">
        Leave blank to keep the current password.
      </p>
      <p v-if="fieldError('password')" class="text-destructive text-sm">
        {{ fieldError('password') }}
      </p>
    </div>

    <div class="space-y-2">
      <Label>Roles</Label>
      <p v-if="rolesLoading" class="text-muted-foreground text-sm">Loading roles…</p>
      <p v-else-if="rolesError" class="text-muted-foreground text-sm">
        Roles are unavailable right now.
      </p>
      <p v-else-if="!roles.length" class="text-muted-foreground text-sm">No roles available.</p>
      <div v-else class="grid gap-2 sm:grid-cols-2">
        <div v-for="role in roles" :key="role.id" class="flex items-center gap-2">
          <Checkbox
            :id="`user-form-role-${role.id}`"
            :model-value="selectedRoles.includes(role.name)"
            @update:model-value="(value) => toggleRole(role.name, value)"
          />
          <Label :for="`user-form-role-${role.id}`" class="font-normal capitalize">
            {{ role.name }}
          </Label>
        </div>
      </div>
      <p v-if="rolesFieldError" class="text-destructive text-sm">{{ rolesFieldError }}</p>
    </div>

    <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" :disabled="pending" @click="emit('cancel')">
        Cancel
      </Button>
      <Button type="submit" :disabled="pending">
        {{ isEdit ? 'Save changes' : 'Create user' }}
      </Button>
    </div>
  </form>
</template>
