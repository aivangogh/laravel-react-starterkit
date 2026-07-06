<script setup lang="ts">
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import { cn } from '@app/ui/lib/utils'

/**
 * A compact - / value / + quantity control. Presentational: value in via `v-model`,
 * clamped changes out. Reused by the product detail page (pre-add quantity) and the
 * cart line items (live quantity update), so the increment/decrement/clamp rules live
 * in one place.
 */
const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  disabled?: boolean
  /** `sm` for dense cart rows, `default` for the detail page. */
  size?: 'sm' | 'default'
  class?: HTMLAttributes['class']
  /** Accessible label prefix, e.g. the product name. */
  label?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const min = computed(() => props.min ?? 1)
const isSmall = computed(() => props.size === 'sm')

const canDecrement = computed(() => !props.disabled && props.modelValue > min.value)
const canIncrement = computed(
  () => !props.disabled && (props.max === undefined || props.modelValue < props.max),
)

function setValue(next: number) {
  const upper = props.max ?? Number.POSITIVE_INFINITY
  const clamped = Math.max(min.value, Math.min(upper, next))
  if (clamped !== props.modelValue) emit('update:modelValue', clamped)
}

const buttonSize = computed(() => (isSmall.value ? 'size-7' : 'size-9'))
const valueWidth = computed(() => (isSmall.value ? 'w-8' : 'w-11'))
const iconSize = computed(() => (isSmall.value ? 'size-3.5' : 'size-4'))
</script>

<template>
  <div
    :class="
      cn(
        'border-input inline-flex items-center rounded-md border',
        disabled && 'opacity-50',
        props.class,
      )
    "
    role="group"
    :aria-label="label ? `Quantity for ${label}` : 'Quantity'"
  >
    <button
      type="button"
      :class="
        cn(
          'text-muted-foreground hover:text-foreground grid place-items-center rounded-l-md transition-colors',
          'focus-visible:ring-ring/50 outline-none focus-visible:ring-2',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-foreground',
          buttonSize,
        )
      "
      :disabled="!canDecrement"
      aria-label="Decrease quantity"
      @click="setValue(modelValue - 1)"
    >
      <Minus :class="iconSize" />
    </button>
    <span
      :class="
        cn('text-center text-sm font-medium tabular-nums select-none', valueWidth)
      "
      aria-live="polite"
    >
      {{ modelValue }}
    </span>
    <button
      type="button"
      :class="
        cn(
          'text-muted-foreground hover:text-foreground grid place-items-center rounded-r-md transition-colors',
          'focus-visible:ring-ring/50 outline-none focus-visible:ring-2',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-foreground',
          buttonSize,
        )
      "
      :disabled="!canIncrement"
      aria-label="Increase quantity"
      @click="setValue(modelValue + 1)"
    >
      <Plus :class="iconSize" />
    </button>
  </div>
</template>
