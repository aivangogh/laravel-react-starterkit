<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@app/ui/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/ui/dialog'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { useActivityDetail } from '@/features/activity/composables/useActivity'
import { causerLabel, formatActivityDate, modelBasename } from '@/features/activity/lib/format'

const props = defineProps<{
  /** The activity id to show, or `null` when nothing is selected. */
  id: number | null
  open: boolean
}>()

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const openModel = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

// Only fetch while the dialog is open and an id is set (getter yields null → query disabled).
const {
  data: activity,
  isLoading,
  isError,
} = useActivityDetail(() => (props.open ? props.id : null))

/** Scalar metadata rendered as a key/value grid. */
const metaRows = computed(() => {
  const item = activity.value
  if (!item) return []
  return [
    { label: 'Event', value: item.event ?? item.log_name ?? '—' },
    { label: 'Log name', value: item.log_name ?? '—' },
    { label: 'Causer', value: causerLabel(item) },
    {
      label: 'Subject',
      value: item.subject_id
        ? `${modelBasename(item.subject_type) ?? 'Record'} #${item.subject_id}`
        : (modelBasename(item.subject_type) ?? '—'),
    },
    { label: 'Date', value: formatActivityDate(item.created_at) },
  ]
})

/** JSON blocks shown for the free-form payloads (may be absent). */
const jsonSections = computed(() => {
  const item = activity.value
  if (!item) return []
  return [
    { label: 'Attribute changes', value: item.attribute_changes },
    { label: 'Properties', value: item.properties },
  ].filter((section): section is { label: string; value: Record<string, unknown> } => {
    return section.value != null && Object.keys(section.value).length > 0
  })
})

function pretty(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2)
}
</script>

<template>
  <Dialog v-model:open="openModel">
    <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-lg" data-slot="activity-detail">
      <DialogHeader>
        <DialogTitle>Activity detail</DialogTitle>
        <DialogDescription>
          {{ activity?.description ?? 'The full record for this activity-log entry.' }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="isLoading" class="space-y-3">
        <Skeleton v-for="n in 4" :key="n" class="h-6 w-full" />
      </div>

      <p v-else-if="isError" class="text-sm text-destructive">
        Could not load this activity entry.
      </p>

      <div v-else-if="activity" class="space-y-5 text-sm">
        <dl class="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
          <template v-for="row in metaRows" :key="row.label">
            <dt class="text-muted-foreground">{{ row.label }}</dt>
            <dd class="min-w-0 break-words font-medium">
              <Badge v-if="row.label === 'Event'" variant="secondary">{{ row.value }}</Badge>
              <template v-else>{{ row.value }}</template>
            </dd>
          </template>
        </dl>

        <section v-for="section in jsonSections" :key="section.label" class="space-y-1.5">
          <h3 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {{ section.label }}
          </h3>
          <pre
            class="bg-muted overflow-x-auto rounded-md p-3 text-xs"
          ><code>{{ pretty(section.value) }}</code></pre>
        </section>

        <p v-if="!jsonSections.length" class="text-muted-foreground text-xs">
          No additional properties were recorded for this event.
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>
