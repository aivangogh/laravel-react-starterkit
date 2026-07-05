<script setup lang="ts">
import { computed, reactive } from 'vue'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@app/ui/components/ui/card'
import { Input } from '@app/ui/components/ui/input'
import { Label } from '@app/ui/components/ui/label'
import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'
import { useProfile } from '@/features/profile/composables/useProfile'

const { updatePasswordMutation } = useProfile()

const form = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const fieldErrors = computed(() => getValidationErrors(updatePasswordMutation.error.value))
const errorMessage = computed(() =>
  updatePasswordMutation.isError.value ? getErrorMessage(updatePasswordMutation.error.value) : '',
)

function onSubmit() {
  updatePasswordMutation.mutate(
    {
      current_password: form.current_password,
      password: form.password,
      password_confirmation: form.password_confirmation,
    },
    {
      onSuccess: () => {
        form.current_password = ''
        form.password = ''
        form.password_confirmation = ''
      },
    },
  )
}
</script>

<template>
  <Card data-slot="profile-password-form">
    <CardHeader>
      <CardTitle>Password</CardTitle>
      <CardDescription>Choose a strong password you don't use elsewhere.</CardDescription>
    </CardHeader>
    <form novalidate @submit.prevent="onSubmit">
      <CardContent class="space-y-4">
        <Alert v-if="errorMessage && Object.keys(fieldErrors).length === 0" variant="destructive">
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <p
          v-if="updatePasswordMutation.isSuccess.value"
          class="text-sm text-muted-foreground"
          role="status"
        >
          Password updated.
        </p>

        <div class="space-y-2">
          <Label for="current-password">Current password</Label>
          <Input
            id="current-password"
            v-model="form.current_password"
            type="password"
            autocomplete="current-password"
            required
          />
          <p v-if="fieldErrors.current_password" class="text-sm text-destructive">
            {{ fieldErrors.current_password[0] }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="new-password">New password</Label>
          <Input
            id="new-password"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            required
          />
          <p v-if="fieldErrors.password" class="text-sm text-destructive">
            {{ fieldErrors.password[0] }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            v-model="form.password_confirmation"
            type="password"
            autocomplete="new-password"
            required
          />
        </div>
      </CardContent>

      <CardFooter class="mt-6">
        <Button type="submit" :disabled="updatePasswordMutation.isPending.value">
          {{ updatePasswordMutation.isPending.value ? 'Updating…' : 'Update password' }}
        </Button>
      </CardFooter>
    </form>
  </Card>
</template>
