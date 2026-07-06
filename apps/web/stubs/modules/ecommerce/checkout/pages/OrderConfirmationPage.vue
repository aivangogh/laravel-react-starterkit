<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Check } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { Separator } from '@app/ui/components/ui/separator'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import type { OrderStatus } from '../../types'
import { formatPrice } from '../../storefront/lib/money'
import { useOrder } from '../composables/useCheckout'

const route = useRoute()
const orderId = computed(() => String(route.params.id))

const { data: order, isPending, isError, refetch } = useOrder(orderId)

/** Short, human-friendly reference derived from the order UUID. */
const orderRef = computed(() =>
  order.value ? `#${order.value.id.slice(0, 8).toUpperCase()}` : '',
)

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' })
const placedOn = computed(() =>
  order.value ? dateFormatter.format(new Date(order.value.created_at)) : '',
)

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  paid: 'default',
  shipped: 'default',
  completed: 'default',
  cancelled: 'destructive',
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <!-- Error -->
    <Alert v-if="isError" variant="destructive">
      <AlertTitle>Couldn't load your order</AlertTitle>
      <AlertDescription>
        <button class="underline underline-offset-4" @click="() => refetch()">Try again</button>
      </AlertDescription>
    </Alert>

    <!-- Loading -->
    <div v-else-if="isPending" class="space-y-6">
      <div class="flex flex-col items-center gap-4 py-8">
        <Skeleton class="size-14 rounded-full" />
        <Skeleton class="h-7 w-52" />
        <Skeleton class="h-4 w-40" />
      </div>
      <Skeleton class="h-48 rounded-2xl" />
    </div>

    <!-- Confirmation -->
    <div v-else-if="order" class="space-y-8">
      <Transition
        appear
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div class="flex flex-col items-center text-center">
          <div
            class="bg-primary text-primary-foreground grid size-14 place-items-center rounded-full"
          >
            <Check class="size-7" />
          </div>
          <h1 class="mt-5 text-2xl font-semibold tracking-tight">Order confirmed</h1>
          <p class="text-muted-foreground mt-2 text-sm">
            Thank you. Your order <span class="text-foreground font-medium">{{ orderRef }}</span> is
            in. A confirmation is on its way.
          </p>
        </div>
      </Transition>

      <div class="bg-card rounded-2xl border">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p class="text-muted-foreground text-xs tracking-wide uppercase">Order</p>
            <p class="mt-0.5 font-medium tabular-nums">{{ orderRef }}</p>
          </div>
          <div class="text-right">
            <p class="text-muted-foreground text-xs tracking-wide uppercase">Placed</p>
            <p class="mt-0.5 text-sm">{{ placedOn }}</p>
          </div>
          <Badge :variant="statusVariant[order.status]" class="capitalize">
            {{ order.status }}
          </Badge>
        </div>

        <Separator />

        <ul class="divide-border divide-y px-6">
          <li
            v-for="line in order.items ?? []"
            :key="line.id"
            class="flex items-center justify-between gap-4 py-4"
          >
            <div class="min-w-0">
              <p class="line-clamp-1 text-sm font-medium">{{ line.name }}</p>
              <p class="text-muted-foreground mt-0.5 text-sm tabular-nums">
                {{ formatPrice(line.unit_price) }} &times; {{ line.quantity }}
              </p>
            </div>
            <span class="text-sm font-medium tabular-nums">
              {{ formatPrice(line.unit_price * line.quantity) }}
            </span>
          </li>
        </ul>

        <Separator />

        <div class="flex items-center justify-between px-6 py-4">
          <span class="text-sm font-medium">Total</span>
          <span class="text-lg font-semibold tabular-nums">{{ formatPrice(order.total) }}</span>
        </div>
      </div>

      <div class="flex justify-center">
        <Button as-child size="lg">
          <RouterLink :to="{ name: 'ecommerce.shop' }">Continue shopping</RouterLink>
        </Button>
      </div>
    </div>
  </section>
</template>
