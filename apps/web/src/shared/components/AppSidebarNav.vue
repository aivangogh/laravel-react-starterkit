<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { RouterLink } from 'vue-router'
import { cn } from '@app/ui/lib/utils'
import { useNavItems } from '@/shared/composables/useNavItems'

interface Props {
  class?: HTMLAttributes['class']
}
const props = defineProps<Props>()

/** Emitted after a nav link is chosen — lets the mobile drawer close itself. */
const emit = defineEmits<{ navigate: [] }>()

const { items } = useNavItems()
</script>

<template>
  <nav :class="cn('flex flex-col gap-1', props.class)" aria-label="Main">
    <RouterLink
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name }"
      class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      exact-active-class="bg-accent text-accent-foreground"
      @click="emit('navigate')"
    >
      <component :is="item.icon" v-if="item.icon" class="size-4 shrink-0" aria-hidden="true" />
      <span>{{ item.title }}</span>
    </RouterLink>
  </nav>
</template>
