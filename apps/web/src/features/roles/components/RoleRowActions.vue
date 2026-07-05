<script setup lang="ts">
import { computed } from 'vue'
import { Ellipsis, Pencil, Trash2 } from 'lucide-vue-next'
import { Button } from '@app/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@app/ui/components/ui/dropdown-menu'
import { usePermissions } from '@/shared/composables/usePermissions'
import { isSystemRole, type RoleRow } from '@/features/roles/composables/useRoles'

/**
 * Per-row actions menu for the roles table. Gates Edit/Delete by the caller's permissions and
 * withholds Delete for protected system roles. Emits intent up to the page, which owns the
 * edit/delete dialogs — this component never mutates.
 */
const props = defineProps<{ role: RoleRow }>()
const emit = defineEmits<{ edit: []; delete: [] }>()

const { can } = usePermissions()

const canEdit = computed(() => can('roles.update'))
const canDelete = computed(() => can('roles.delete') && !isSystemRole(props.role.name))
const hasActions = computed(() => canEdit.value || canDelete.value)
</script>

<template>
  <div class="text-right">
    <DropdownMenu v-if="hasActions">
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="icon-sm" :aria-label="`Actions for ${props.role.name}`">
          <Ellipsis class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem v-if="canEdit" @select="emit('edit')">
          <Pencil class="size-4" />
          Edit
        </DropdownMenuItem>
        <template v-if="canDelete">
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" @select="emit('delete')">
            <Trash2 class="size-4" />
            Delete
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>

    <span v-else class="text-muted-foreground text-sm">—</span>
  </div>
</template>
