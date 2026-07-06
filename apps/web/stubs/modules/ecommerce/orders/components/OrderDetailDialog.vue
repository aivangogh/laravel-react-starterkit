<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@app/ui/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@app/ui/components/ui/alert-dialog'
import { Button } from '@app/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/ui/dialog'
import { Label } from '@app/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@app/ui/components/ui/select'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { getErrorMessage } from '@/shared/lib/http'
import { usePermissions } from '@/shared/composables/usePermissions'
import type { OrderStatus } from '../../types'
import { formatMoney } from '../lib/money'
import { useDeleteOrder, useOrderDetail, useUpdateOrderStatus } from '../composables/useOrders'

/**
 * Back-office order detail. Fetches the single order (with line items) on open, lets an
 * `orders.update` user change its status, and an `orders.delete` user remove it behind an
 * alert-dialog confirm. All writes invalidate the list + detail caches via the composable.
 */
const props = withDefaults(defineProps<{ open: boolean; orderId?: string | null }>(), {
  orderId: null,
})
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const open = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const { can } = usePermissions()

// Only fetch while the dialog is open for a given row.
const orderQuery = useOrderDetail(() => (props.open ? props.orderId : null))
const order = computed(() => orderQuery.data.value ?? null)

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'shipped', 'completed', 'cancelled']

// Local editable status, mirrored from the fetched order.
const status = ref<OrderStatus | null>(null)
watch(order, (value) => (status.value = value?.status ?? null), { immediate: true })

const updateStatus = useUpdateOrderStatus()
const deleteOrder = useDeleteOrder()

const errorMessage = ref('')
const confirmDeleteOpen = ref(false)

const dirty = computed(
  () => order.value != null && status.value != null && status.value !== order.value.status,
)

// Reset transient UI whenever the dialog is (re)opened.
watch(open, (value) => {
  if (value) errorMessage.value = ''
})

async function saveStatus(): Promise<void> {
  if (!order.value || !status.value) return
  errorMessage.value = ''
  try {
    await updateStatus.mutateAsync({ id: order.value.id, status: status.value })
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
}

async function confirmDelete(): Promise<void> {
  if (!order.value) return
  errorMessage.value = ''
  try {
    await deleteOrder.mutateAsync(order.value.id)
    confirmDeleteOpen.value = false
    open.value = false
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  }
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          Order
          <span v-if="orderId" class="font-mono text-base">#{{ orderId.slice(0, 8) }}</span>
        </DialogTitle>
        <DialogDescription>
          <template v-if="order">Placed {{ dateFormatter.format(new Date(order.created_at)) }}</template>
          <template v-else>Loading order details…</template>
        </DialogDescription>
      </DialogHeader>

      <Alert v-if="errorMessage" variant="destructive">
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>

      <!-- Line items -->
      <div class="space-y-3">
        <template v-if="orderQuery.isLoading.value">
          <Skeleton v-for="n in 3" :key="`item-skeleton-${n}`" class="h-10 w-full" />
        </template>

        <template v-else-if="order">
          <ul class="divide-border divide-y rounded-md border">
            <li
              v-for="item in order.items ?? []"
              :key="item.id"
              class="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <div class="min-w-0">
                <p class="truncate font-medium">{{ item.name }}</p>
                <p class="text-muted-foreground text-xs tabular-nums">
                  {{ formatMoney(item.unit_price) }} × {{ item.quantity }}
                </p>
              </div>
              <span class="font-medium tabular-nums">
                {{ formatMoney(item.unit_price * item.quantity) }}
              </span>
            </li>
            <li
              v-if="!(order.items ?? []).length"
              class="text-muted-foreground px-3 py-4 text-center text-sm"
            >
              This order has no line items.
            </li>
          </ul>

          <div class="flex items-center justify-between px-1 text-sm font-semibold">
            <span>Total</span>
            <span class="tabular-nums">{{ formatMoney(order.total) }}</span>
          </div>
        </template>
      </div>

      <!-- Status control -->
      <div v-if="order && can('orders.update')" class="space-y-2">
        <Label for="order-status">Status</Label>
        <div class="flex items-center gap-2">
          <Select
            :model-value="status ?? undefined"
            @update:model-value="(value) => (status = value as OrderStatus)"
          >
            <SelectTrigger id="order-status" class="flex-1 capitalize">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in STATUS_OPTIONS"
                :key="option"
                :value="option"
                class="capitalize"
              >
                {{ option }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button :disabled="!dirty || updateStatus.isPending.value" @click="saveStatus">
            Save
          </Button>
        </div>
      </div>

      <DialogFooter class="sm:justify-between">
        <Button
          v-if="order && can('orders.delete')"
          variant="outline"
          class="text-destructive hover:text-destructive"
          @click="confirmDeleteOpen = true"
        >
          <Trash2 class="size-4" />
          Delete order
        </Button>
        <span v-else />
        <Button variant="secondary" @click="open = false">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete confirmation -->
  <AlertDialog v-model:open="confirmDeleteOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete order</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently deletes
          <span v-if="orderId" class="text-foreground font-medium font-mono"
            >#{{ orderId.slice(0, 8) }}</span
          >
          and its line items. This cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="deleteOrder.isPending.value">Cancel</AlertDialogCancel>
        <Button
          variant="destructive"
          :disabled="deleteOrder.isPending.value"
          @click="confirmDelete"
        >
          Delete
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
