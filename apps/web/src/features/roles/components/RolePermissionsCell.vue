<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@app/ui/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@app/ui/components/ui/tooltip'

/**
 * Renders a role's permission set compactly in a table cell: a count badge, the first few
 * permission names as badges, and a `+N` badge (with a tooltip listing the remainder) when there
 * are more than fit. Presentational — takes the permission names, emits nothing.
 */
const props = withDefaults(defineProps<{ permissions: string[]; max?: number }>(), { max: 3 })

const visible = computed(() => props.permissions.slice(0, props.max))
const overflow = computed(() => props.permissions.slice(props.max))
</script>

<template>
  <div v-if="props.permissions.length" class="flex flex-wrap items-center gap-1">
    <Badge variant="secondary">{{ props.permissions.length }}</Badge>
    <Badge v-for="name in visible" :key="name" variant="outline" class="font-normal">
      {{ name }}
    </Badge>

    <TooltipProvider v-if="overflow.length">
      <Tooltip>
        <TooltipTrigger as-child>
          <Badge variant="outline" class="cursor-default font-normal">+{{ overflow.length }}</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <ul class="space-y-0.5">
            <li v-for="name in overflow" :key="name">{{ name }}</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>

  <span v-else class="text-muted-foreground text-sm">None</span>
</template>
