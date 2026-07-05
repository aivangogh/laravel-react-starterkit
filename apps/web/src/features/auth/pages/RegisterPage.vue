<script setup lang="ts">
import { computed, reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
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

const router = useRouter()
const { registerMutation } = useAuth()

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const fieldErrors = computed(() => getValidationErrors(registerMutation.error.value))
const errorMessage = computed(() =>
  registerMutation.isError.value ? getErrorMessage(registerMutation.error.value) : '',
)

function onSubmit() {
  registerMutation.mutate(
    { ...form },
    {
      onSuccess: () => {
        void router.push({ name: 'home' })
      },
    },
  )
}
</script>

<template>
  <AuthLayout>
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Create account</CardTitle>
        <CardDescription>Sign up to get started.</CardDescription>
      </CardHeader>
      <form novalidate @submit.prevent="onSubmit">
        <CardContent class="space-y-4">
          <Alert v-if="errorMessage && Object.keys(fieldErrors).length === 0" variant="destructive">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" v-model="form.name" type="text" autocomplete="name" required />
            <p v-if="fieldErrors.name" class="text-sm text-destructive">
              {{ fieldErrors.name[0] }}
            </p>
          </div>

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
            <Label for="password">Password</Label>
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
            <Label for="password_confirmation">Confirm password</Label>
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
          <Button type="submit" class="w-full" :disabled="registerMutation.isPending.value">
            {{ registerMutation.isPending.value ? 'Creating account…' : 'Create account' }}
          </Button>
          <p class="text-center text-sm text-muted-foreground">
            Already have an account?
            <RouterLink
              :to="{ name: 'login' }"
              class="text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </RouterLink>
          </p>
        </CardFooter>
      </form>
    </Card>
  </AuthLayout>
</template>
