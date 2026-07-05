<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@app/ui/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}
const props = defineProps<Props>()
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
    <div :class="cn('w-full max-w-sm', props.class)">
      <slot />
    </div>
  </main>
</template>
