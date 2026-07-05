<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
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
import { useAuth } from '@/features/auth/composables/useAuth'
import { useProfile } from '@/features/profile/composables/useProfile'

const { user } = useAuth()
const { updateProfileMutation } = useProfile()

const form = reactive({
  name: user.value?.name ?? '',
  email: user.value?.email ?? '',
})

// Seed the form once the session user resolves (deep links may render before it's ready).
watch(user, (value) => {
  if (value) {
    form.name = value.name
    form.email = value.email
  }
})

const fieldErrors = computed(() => getValidationErrors(updateProfileMutation.error.value))
const errorMessage = computed(() =>
  updateProfileMutation.isError.value ? getErrorMessage(updateProfileMutation.error.value) : '',
)

function onSubmit() {
  updateProfileMutation.mutate({ name: form.name, email: form.email })
}
</script>

<template>
  <Card data-slot="profile-info-form">
    <CardHeader>
      <CardTitle>Profile information</CardTitle>
      <CardDescription>Update your name and email address.</CardDescription>
    </CardHeader>
    <form novalidate @submit.prevent="onSubmit">
      <CardContent class="space-y-4">
        <Alert v-if="errorMessage && Object.keys(fieldErrors).length === 0" variant="destructive">
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <p
          v-if="updateProfileMutation.isSuccess.value"
          class="text-sm text-muted-foreground"
          role="status"
        >
          Saved.
        </p>

        <div class="space-y-2">
          <Label for="profile-name">Name</Label>
          <Input id="profile-name" v-model="form.name" autocomplete="name" required />
          <p v-if="fieldErrors.name" class="text-sm text-destructive">{{ fieldErrors.name[0] }}</p>
        </div>

        <div class="space-y-2">
          <Label for="profile-email">Email</Label>
          <Input
            id="profile-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
          />
          <p v-if="fieldErrors.email" class="text-sm text-destructive">
            {{ fieldErrors.email[0] }}
          </p>
        </div>
      </CardContent>

      <CardFooter class="mt-6">
        <Button type="submit" :disabled="updateProfileMutation.isPending.value">
          {{ updateProfileMutation.isPending.value ? 'Saving…' : 'Save changes' }}
        </Button>
      </CardFooter>
    </form>
  </Card>
</template>
