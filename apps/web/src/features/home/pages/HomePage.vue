<script setup lang="ts">
import { Button } from '@app/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@app/ui/components/ui/card'
import { useAuth } from '@/features/auth/composables/useAuth'

const { user } = useAuth()
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Welcome{{ user ? `, ${user.name}` : '' }}</CardTitle>
        <CardDescription>You are signed in. This is a protected route.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap items-center gap-3">
        <!-- Demonstrates the v-can directive: only rendered for users holding the permission. -->
        <Button v-can="'users.view'" variant="secondary">Manage users</Button>
      </CardContent>
    </Card>
  </div>
</template>
