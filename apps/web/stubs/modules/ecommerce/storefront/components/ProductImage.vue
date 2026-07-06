<script setup lang="ts">
import { ref, watch } from 'vue'
import type { HTMLAttributes } from 'vue'
import { ImageOff } from 'lucide-vue-next'
import { cn } from '@app/ui/lib/utils'

/**
 * Product imagery with a graceful fallback. `Product.image_url` is nullable and remote
 * URLs can 404, so a null/failed source degrades to a muted placeholder tile instead of
 * a broken-image glyph. Shared across the card, detail, cart, and order surfaces.
 */
const props = defineProps<{
  src: string | null | undefined
  alt: string
  /** Tailwind aspect + rounding utilities for the wrapper. */
  class?: HTMLAttributes['class']
  /** Extra classes for the <img> itself (e.g. a group-hover zoom transform). */
  imgClass?: HTMLAttributes['class']
  /** Larger placeholder icon for hero/detail contexts. */
  large?: boolean
}>()

const failed = ref(false)

// Reset the error state whenever the source changes (e.g. navigating between products).
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <div
    :class="
      cn(
        'bg-muted text-muted-foreground relative overflow-hidden',
        props.class,
      )
    "
  >
    <img
      v-if="src && !failed"
      :src="src"
      :alt="alt"
      loading="lazy"
      decoding="async"
      :class="cn('h-full w-full object-cover', imgClass)"
      @error="failed = true"
    />
    <div v-else class="flex h-full w-full items-center justify-center">
      <ImageOff :class="large ? 'size-10' : 'size-6'" aria-hidden="true" />
      <span class="sr-only">{{ alt }}</span>
    </div>
  </div>
</template>
