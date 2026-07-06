<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Loader2, ShoppingCart, Trash2 } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import { Separator } from '@app/ui/components/ui/separator'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import type { CartItem } from '../../types'
import { formatPrice } from '../../storefront/lib/money'
import ProductImage from '../../storefront/components/ProductImage.vue'
import QuantityStepper from '../../storefront/components/QuantityStepper.vue'
import { useCart } from '../composables/useCart'

const { cartQuery, items, itemCount, subtotal, isEmpty, updateItem, removeItem, clearCart } =
  useCart()

// Track the single line currently mutating so we only disable that row's controls.
const mutatingId = ref<string | null>(null)

function lineTotal(item: CartItem): number {
  return (item.product?.price ?? 0) * item.quantity
}

function changeQuantity(item: CartItem, quantity: number) {
  mutatingId.value = item.id
  updateItem.mutate({ id: item.id, quantity }, { onSettled: () => (mutatingId.value = null) })
}

function remove(item: CartItem) {
  mutatingId.value = item.id
  removeItem.mutate(item.id, { onSettled: () => (mutatingId.value = null) })
}
</script>

<template>
  <section class="space-y-8">
    <header class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Your cart</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          <template v-if="itemCount > 0">
            {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }} ready to check out.
          </template>
          <template v-else>Review your items before checkout.</template>
        </p>
      </div>
      <Button
        v-if="!isEmpty"
        variant="ghost"
        size="sm"
        class="text-muted-foreground"
        :disabled="clearCart.isPending.value"
        @click="clearCart.mutate()"
      >
        Clear cart
      </Button>
    </header>

    <Alert v-if="cartQuery.isError.value" variant="destructive">
      <AlertTitle>Couldn't load your cart</AlertTitle>
      <AlertDescription>
        <button class="underline underline-offset-4" @click="() => cartQuery.refetch()">
          Try again
        </button>
      </AlertDescription>
    </Alert>

    <!-- Loading -->
    <div v-else-if="cartQuery.isPending.value" class="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div class="space-y-5">
        <div v-for="n in 3" :key="n" class="flex gap-4">
          <Skeleton class="size-20 shrink-0 rounded-lg" />
          <div class="flex-1 space-y-2 py-1">
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-4 w-20" />
          </div>
        </div>
      </div>
      <Skeleton class="h-56 rounded-2xl" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="isEmpty"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center"
    >
      <ShoppingCart class="text-muted-foreground/60 size-10" />
      <h2 class="mt-4 text-lg font-medium">Your cart is empty</h2>
      <p class="text-muted-foreground mt-1 max-w-xs text-sm">
        Browse the collection and add something you love.
      </p>
      <Button as-child class="mt-6">
        <RouterLink :to="{ name: 'ecommerce.shop' }">Start shopping</RouterLink>
      </Button>
    </div>

    <!-- Cart with items -->
    <div v-else class="grid items-start gap-10 lg:grid-cols-[1fr_20rem]">
      <ul class="divide-border divide-y">
        <li
          v-for="item in items"
          :key="item.id"
          class="flex gap-4 py-5 first:pt-0"
          :class="mutatingId === item.id && 'opacity-60'"
        >
          <RouterLink
            :to="{ name: 'ecommerce.shop.product', params: { id: item.product_id } }"
            class="shrink-0"
          >
            <ProductImage
              :src="item.product?.image_url"
              :alt="item.product?.name ?? 'Product'"
              class="size-20 rounded-lg border sm:size-24"
            />
          </RouterLink>

          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <RouterLink
                  :to="{ name: 'ecommerce.shop.product', params: { id: item.product_id } }"
                  class="hover:text-muted-foreground line-clamp-1 text-sm font-medium transition-colors"
                >
                  {{ item.product?.name ?? 'Product' }}
                </RouterLink>
                <p v-if="item.product" class="text-muted-foreground mt-0.5 text-sm tabular-nums">
                  {{ formatPrice(item.product.price) }} each
                </p>
              </div>
              <span class="text-sm font-semibold tabular-nums">{{ formatPrice(lineTotal(item)) }}</span>
            </div>

            <div class="mt-auto flex items-center justify-between gap-3">
              <QuantityStepper
                size="sm"
                :model-value="item.quantity"
                :max="item.product?.stock || undefined"
                :disabled="mutatingId === item.id"
                :label="item.product?.name"
                @update:model-value="(q) => changeQuantity(item, q)"
              />
              <button
                type="button"
                class="text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
                :disabled="mutatingId === item.id"
                @click="remove(item)"
              >
                <Loader2 v-if="mutatingId === item.id" class="size-3.5 animate-spin" />
                <Trash2 v-else class="size-3.5" />
                Remove
              </button>
            </div>
          </div>
        </li>
      </ul>

      <!-- Order summary -->
      <aside class="bg-card rounded-2xl border p-6 lg:sticky lg:top-20">
        <h2 class="text-base font-semibold">Order summary</h2>
        <dl class="mt-4 space-y-2.5 text-sm">
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Subtotal</dt>
            <dd class="tabular-nums">{{ formatPrice(subtotal) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-muted-foreground">Shipping</dt>
            <dd class="text-muted-foreground">Free</dd>
          </div>
        </dl>
        <Separator class="my-4" />
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Total</span>
          <span class="text-lg font-semibold tabular-nums">{{ formatPrice(subtotal) }}</span>
        </div>
        <Button as-child size="lg" class="mt-6 w-full">
          <RouterLink :to="{ name: 'ecommerce.checkout' }">
            Proceed to checkout
            <ArrowRight class="size-4" />
          </RouterLink>
        </Button>
        <RouterLink
          :to="{ name: 'ecommerce.shop' }"
          class="text-muted-foreground hover:text-foreground mt-4 block text-center text-sm transition-colors"
        >
          Continue shopping
        </RouterLink>
      </aside>
    </div>
  </section>
</template>
