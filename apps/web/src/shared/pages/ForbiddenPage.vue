<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { Button } from '@app/ui/components/ui/button'

/**
 * 403 landing. The router guard redirects here when an authenticated user hits a route whose
 * `meta.permission` they don't hold. Rendered inside the DashboardLayout shell.
 */
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
    <div class="flex size-12 items-center justify-center rounded-full bg-destructive/10">
      <ShieldAlert class="size-6 text-destructive" aria-hidden="true" />
    </div>
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">Access denied</h1>
      <p class="text-sm text-muted-foreground">
        You don't have permission to view this page. If you think this is a mistake, contact an
        administrator.
      </p>
    </div>
    <Button as-child variant="outline">
      <RouterLink :to="{ name: 'home' }">Back to home</RouterLink>
    </Button>
  </div>
</template>
