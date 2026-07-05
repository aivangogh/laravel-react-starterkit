<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Button } from '@app/ui/components/ui/button'
import { Input } from '@app/ui/components/ui/input'
import { Label } from '@app/ui/components/ui/label'
import { Switch } from '@app/ui/components/ui/switch'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@app/ui/components/ui/card'
import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'
import { usePermissions } from '@/shared/composables/usePermissions'
import { useSettings } from '@/features/settings/composables/useSettings'

const { can } = usePermissions()
const { settingsQuery, updateMutation } = useSettings()

// `settings.update` gates the whole form: without it the inputs are read-only and Save is hidden.
const canUpdate = computed(() => can('settings.update'))

const form = reactive({
  app_name: '',
  support_email: '',
  registration_enabled: false,
})

// Hydrate the form from the server copy whenever it loads or is refetched.
watch(
  settingsQuery.data,
  (data) => {
    if (!data) return
    form.app_name = data.app_name
    form.support_email = data.support_email ?? ''
    form.registration_enabled = data.registration_enabled
  },
  { immediate: true },
)

const fieldErrors = computed(() => getValidationErrors(updateMutation.error.value))
const errorMessage = computed(() =>
  updateMutation.isError.value && Object.keys(fieldErrors.value).length === 0
    ? getErrorMessage(updateMutation.error.value)
    : '',
)

function onSubmit() {
  if (!canUpdate.value) return
  updateMutation.mutate({
    app_name: form.app_name,
    // An empty email field clears the value rather than sending a blank string.
    support_email: form.support_email.trim() === '' ? null : form.support_email,
    registration_enabled: form.registration_enabled,
  })
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
      <p class="text-muted-foreground text-sm">Manage application-wide general settings.</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>These settings apply across the whole application.</CardDescription>
      </CardHeader>

      <!-- Loading skeleton while the initial settings query resolves. -->
      <CardContent v-if="settingsQuery.isLoading.value" class="space-y-6">
        <div class="space-y-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-9 w-full" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-9 w-full" />
        </div>
        <Skeleton class="h-6 w-40" />
      </CardContent>

      <form v-else novalidate @submit.prevent="onSubmit">
        <CardContent class="space-y-6">
          <Alert v-if="errorMessage" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>
          <Alert v-else-if="updateMutation.isSuccess.value">
            <AlertDescription>Your changes have been saved.</AlertDescription>
          </Alert>

          <div class="space-y-2">
            <Label for="app_name">Application name</Label>
            <Input
              id="app_name"
              v-model="form.app_name"
              :disabled="!canUpdate"
              placeholder="My Application"
              required
            />
            <p v-if="fieldErrors.app_name" class="text-destructive text-sm">
              {{ fieldErrors.app_name[0] }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="support_email">Support email</Label>
            <Input
              id="support_email"
              v-model="form.support_email"
              type="email"
              :disabled="!canUpdate"
              placeholder="support@example.com"
            />
            <p v-if="fieldErrors.support_email" class="text-destructive text-sm">
              {{ fieldErrors.support_email[0] }}
            </p>
          </div>

          <div class="flex items-center justify-between gap-4">
            <div class="space-y-0.5">
              <Label for="registration_enabled">Registration enabled</Label>
              <p class="text-muted-foreground text-sm">Allow new users to create an account.</p>
            </div>
            <Switch
              id="registration_enabled"
              v-model="form.registration_enabled"
              :disabled="!canUpdate"
              aria-label="Registration enabled"
            />
          </div>
        </CardContent>

        <CardFooter v-if="canUpdate" class="mt-6">
          <Button type="submit" :disabled="updateMutation.isPending.value">
            {{ updateMutation.isPending.value ? 'Saving…' : 'Save changes' }}
          </Button>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>
