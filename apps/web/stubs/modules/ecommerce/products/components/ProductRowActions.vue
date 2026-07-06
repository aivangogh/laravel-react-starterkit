<script setup lang="ts">
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
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
import type { Product } from '../../types'

/**
 * Per-row actions menu for the products table. Items are gated by `catalog.update` /
 * `catalog.delete`; the component only emits intent — the page owns the dialogs.
 */
defineProps<{ product: Product }>()
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
      <DropdownMenuItem v-if="can('catalog.update')" @select="emit('edit')">
        <Pencil class="size-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="can('catalog.update') && can('catalog.delete')" />
      <DropdownMenuItem
        v-if="can('catalog.delete')"
        class="text-destructive focus:text-destructive"
        @select="emit('delete')"
      >
        <Trash2 class="size-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
