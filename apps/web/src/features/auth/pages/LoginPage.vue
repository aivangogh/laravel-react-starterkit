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

const router = useRouter()
const route = useRoute()
const { loginMutation } = useAuth()

const form = reactive({ email: '', password: '' })

const fieldErrors = computed(() => getValidationErrors(loginMutation.error.value))
const errorMessage = computed(() =>
  loginMutation.isError.value ? getErrorMessage(loginMutation.error.value) : '',
)

function onSubmit() {
  loginMutation.mutate(
    { email: form.email, password: form.password },
    {
      onSuccess: () => {
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : undefined
        void router.push(redirect ?? { name: 'home' })
      },
    },
  )
}
</script>

<template>
  <AuthLayout>
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
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
            <div class="flex items-center justify-between">
              <Label for="password">Password</Label>
              <RouterLink
                :to="{ name: 'forgot-password' }"
                class="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </RouterLink>
            </div>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              required
            />
            <p v-if="fieldErrors.password" class="text-sm text-destructive">
              {{ fieldErrors.password[0] }}
            </p>
          </div>
        </CardContent>

        <CardFooter class="mt-6 flex-col gap-4">
          <Button type="submit" class="w-full" :disabled="loginMutation.isPending.value">
            {{ loginMutation.isPending.value ? 'Signing in…' : 'Sign in' }}
          </Button>
          <p class="text-center text-sm text-muted-foreground">
            Don't have an account?
            <RouterLink
              :to="{ name: 'register' }"
              class="text-foreground underline-offset-4 hover:underline"
            >
              Create one
            </RouterLink>
          </p>
        </CardFooter>
      </form>
    </Card>
  </AuthLayout>
</template>
