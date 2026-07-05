<script setup lang="ts">
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import type { User } from '@app/types'
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

/**
 * Per-row actions menu for the users table. Items are gated by `users.update` / `users.delete`;
 * the component only emits intent — the page owns the dialogs.
 */
defineProps<{ user: User }>()
const emit = defineEmits<{ edit: []; delete: [] }>()

const { can } = usePermissions()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon-sm" aria-label="Open actions menu">
        <MoreHorizontal class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem v-if="can('users.update')" @select="emit('edit')">
        <Pencil class="size-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="can('users.update') && can('users.delete')" />
      <DropdownMenuItem
        v-if="can('users.delete')"
        class="text-destructive focus:text-destructive"
        @select="emit('delete')"
      >
        <Trash2 class="size-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
