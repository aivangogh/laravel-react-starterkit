<script setup lang="ts">
import { computed, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@app/ui/components/ui/button'
import { Input } from '@app/ui/components/ui/input'
import { Label } from '@app/ui/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@app/ui/components/ui/card'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import AuthLayout from '@/shared/layouts/AuthLayout.vue'
import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'
import { useAuth } from '@/features/auth/composables/useAuth'

const { forgotPasswordMutation } = useAuth()

const form = reactive({ email: '' })

const fieldErrors = computed(() => getValidationErrors(forgotPasswordMutation.error.value))
const errorMessage = computed(() =>
  forgotPasswordMutation.isError.value ? getErrorMessage(forgotPasswordMutation.error.value) : '',
)
const successMessage = computed(() =>
  forgotPasswordMutation.isSuccess.value
    ? (forgotPasswordMutation.data.value?.message ??
      'If that email exists, a reset link is on its way.')
    : '',
)

function onSubmit() {
  forgotPasswordMutation.mutate({ email: form.email })
}
</script>

<template>
  <AuthLayout>
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Forgot password</CardTitle>
        <CardDescription>Enter your email and we'll send a reset link.</CardDescription>
      </CardHeader>
      <form novalidate @submit.prevent="onSubmit">
        <CardContent class="space-y-4">
          <Alert v-if="successMessage">
            <AlertDescription>{{ successMessage }}</AlertDescription>
          </Alert>
          <Alert v-if="errorMessage && Object.keys(fieldErrors).length === 0" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              required
            />
            <p v-if="fieldErrors.email" class="text-sm text-destructive">
              {{ fieldErrors.email[0] }}
            </p>
          </div>
        </CardContent>

        <CardFooter class="mt-6 flex-col gap-4">
          <Button type="submit" class="w-full" :disabled="forgotPasswordMutation.isPending.value">
            {{ forgotPasswordMutation.isPending.value ? 'Sending…' : 'Send reset link' }}
          </Button>
          <p class="text-center text-sm text-muted-foreground">
            <RouterLink
              :to="{ name: 'login' }"
              class="text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </RouterLink>
          </p>
        </CardFooter>
      </form>
    </Card>
  </AuthLayout>
</template>
