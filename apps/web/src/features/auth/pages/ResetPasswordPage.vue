<script setup lang="ts">
import { computed, reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
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

const route = useRoute()
const router = useRouter()
const { resetPasswordMutation } = useAuth()

// Fortify reset links carry `token` in the path and `email` in the query string.
const form = reactive({
  token: typeof route.query.token === 'string' ? route.query.token : '',
  email: typeof route.query.email === 'string' ? route.query.email : '',
  password: '',
  password_confirmation: '',
})

const fieldErrors = computed(() => getValidationErrors(resetPasswordMutation.error.value))
const errorMessage = computed(() =>
  resetPasswordMutation.isError.value ? getErrorMessage(resetPasswordMutation.error.value) : '',
)

function onSubmit() {
  resetPasswordMutation.mutate(
    { ...form },
    {
      onSuccess: () => {
        void router.push({ name: 'login' })
      },
    },
  )
}
</script>

<template>
  <AuthLayout>
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Reset password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <form novalidate @submit.prevent="onSubmit">
        <CardContent class="space-y-4">
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

          <div class="space-y-2">
            <Label for="password">New password</Label>
            <Input
              id="password"
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
            <Label for="password_confirmation">Confirm new password</Label>
            <Input
              id="password_confirmation"
              v-model="form.password_confirmation"
              type="password"
              autocomplete="new-password"
              required
            />
          </div>
        </CardContent>

        <CardFooter class="mt-6 flex-col gap-4">
          <Button type="submit" class="w-full" :disabled="resetPasswordMutation.isPending.value">
            {{ resetPasswordMutation.isPending.value ? 'Resetting…' : 'Reset password' }}
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
