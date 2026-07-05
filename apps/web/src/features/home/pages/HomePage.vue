<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@app/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@app/ui/components/ui/card'
import { useAuth } from '@/features/auth/composables/useAuth'

const router = useRouter()
const { user, logoutMutation } = useAuth()

function onLogout() {
  logoutMutation.mutate(undefined, {
    onSuccess: () => {
      void router.push({ name: 'login' })
    },
  })
}
</script>

<template>
  <main class="mx-auto max-w-2xl p-6">
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Welcome{{ user ? `, ${user.name}` : '' }}</CardTitle>
        <CardDescription>You are signed in. This is a protected route.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap items-center gap-3">
        <!-- Demonstrates the v-can directive: only rendered for users holding the permission. -->
        <Button v-can="'users.view'" variant="secondary">Manage users</Button>
        <Button variant="outline" :disabled="logoutMutation.isPending.value" @click="onLogout">
          {{ logoutMutation.isPending.value ? 'Signing out…' : 'Sign out' }}
        </Button>
      </CardContent>
    </Card>
  </main>
</template>
