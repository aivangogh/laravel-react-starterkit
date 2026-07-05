<script setup lang="ts">
import { computed } from 'vue'
import type { Permission } from '@app/types'
import { Checkbox } from '@app/ui/components/ui/checkbox'
import { Label } from '@app/ui/components/ui/label'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { cn } from '@app/ui/lib/utils'

/**
 * Grouped permission picker. Presentational: it takes the full permission catalogue and the set of
 * currently-selected permission NAMES (`v-model`), groups the catalogue by the prefix before the
 * first `.` (e.g. `users.*`, `roles.*`) for readability, and emits the new selection on every
 * toggle. It never fetches — the parent form owns the catalogue query.
 */
const props = withDefaults(
  defineProps<{
    permissions: Permission[]
    loading?: boolean
    /** Marks the whole field invalid (e.g. a 422 on `permissions`). */
    invalid?: boolean
  }>(),
  { loading: false, invalid: false },
)

/** Selected permission names — two-way bound with the parent form. */
const selected = defineModel<string[]>({ default: () => [] })

const selectedSet = computed(() => new Set(selected.value))

interface PermissionGroup {
  key: string
  label: string
  items: Permission[]
}

/** Group by the segment before the first dot; ungrouped names fall under "general". */
const groups = computed<PermissionGroup[]>(() => {
  const byKey = new Map<string, Permission[]>()
  for (const permission of props.permissions) {
    const key = permission.name.includes('.') ? permission.name.split('.')[0] : 'general'
    const bucket = byKey.get(key)
    if (bucket) bucket.push(permission)
    else byKey.set(key, [permission])
  }
  return [...byKey.entries()]
    .map(([key, items]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

/** Label for a single checkbox: the action after the dot, or the full name when ungrouped. */
function actionLabel(name: string): string {
  return name.includes('.') ? name.slice(name.indexOf('.') + 1) : name
}

function togglePermission(name: string, checked: boolean | 'indeterminate'): void {
  const next = new Set(selected.value)
  if (checked === true) next.add(name)
  else next.delete(name)
  selected.value = [...next]
}

/** Tri-state for a group's master checkbox. */
function groupState(group: PermissionGroup): boolean | 'indeterminate' {
  const checked = group.items.filter((p) => selectedSet.value.has(p.name)).length
  if (checked === 0) return false
  if (checked === group.items.length) return true
  return 'indeterminate'
}

function toggleGroup(group: PermissionGroup, checked: boolean | 'indeterminate'): void {
  const next = new Set(selected.value)
  for (const permission of group.items) {
    if (checked === true) next.add(permission.name)
    else next.delete(permission.name)
  }
  selected.value = [...next]
}
</script>

<template>
  <div
    data-slot="permission-matrix"
    :class="cn('space-y-4', props.invalid && 'rounded-md ring-1 ring-destructive/40 p-3')"
  >
    <div v-if="props.loading" class="space-y-3">
      <Skeleton v-for="n in 3" :key="n" class="h-16 w-full" />
    </div>

    <p v-else-if="!groups.length" class="text-muted-foreground text-sm">
      No permissions available.
    </p>

    <fieldset v-for="group in groups" v-else :key="group.key" class="rounded-md border p-3">
      <div class="mb-2 flex items-center gap-2">
        <Checkbox
          :id="`perm-group-${group.key}`"
          :model-value="groupState(group)"
          @update:model-value="(value) => toggleGroup(group, value)"
        />
        <Label :for="`perm-group-${group.key}`" class="text-sm font-semibold">
          {{ group.label }}
        </Label>
      </div>

      <div class="grid grid-cols-2 gap-x-4 gap-y-2 pl-6 sm:grid-cols-3">
        <div v-for="permission in group.items" :key="permission.id" class="flex items-center gap-2">
          <Checkbox
            :id="`perm-${permission.id}`"
            :model-value="selectedSet.has(permission.name)"
            @update:model-value="(value) => togglePermission(permission.name, value)"
          />
          <Label :for="`perm-${permission.id}`" class="text-sm font-normal capitalize">
            {{ actionLabel(permission.name) }}
          </Label>
        </div>
      </div>
    </fieldset>
  </div>
</template>
