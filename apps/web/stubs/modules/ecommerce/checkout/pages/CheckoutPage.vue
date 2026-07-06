<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, Loader2, Lock } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Button } from '@app/ui/components/ui/button'
import { Separator } from '@app/ui/components/ui/separator'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { getErrorMessage } from '@/shared/lib/http'
import { useAuth } from '@/features/auth/composables/useAuth'
import { formatPrice } from '../../storefront/lib/money'
import ProductImage from '../../storefront/components/ProductImage.vue'
import { useCart } from '../../cart/composables/useCart'
import { usePlaceOrder } from '../composables/useCheckout'

const { cartQuery, items, itemCount, subtotal, isEmpty } = useCart()
const { user } = useAuth()
const placeOrder = usePlaceOrder()

const errorMessage = computed(() =>
  placeOrder.isError.value ? getErrorMessage(placeOrder.error.value) : '',
)
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-8">
    <div>
      <RouterLink
        :to="{ name: 'ecommerce.cart' }"
        class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft class="size-4" />
        Back to cart
      </RouterLink>
      <h1 class="mt-3 text-2xl font-semibold tracking-tight">Checkout</h1>
    </div>

    <!-- Loading -->
    <div v-if="cartQuery.isPending.value" class="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <Skeleton class="h-64 rounded-2xl" />
      <Skeleton class="h-56 rounded-2xl" />
    </div>

    <!-- Empty: nothing to check out -->
    <div
      v-else-if="isEmpty"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center"
    >
      <h2 class="text-lg font-medium">Your cart is empty</h2>
      <p class="text-muted-foreground mt-1 max-w-xs text-sm">
        Add something to your cart before checking out.
      </p>
      <Button as-child class="mt-6">
        <RouterLink :to="{ name: 'ecommerce.shop' }">Browse the shop</RouterLink>
      </Button>
    </div>

    <div v-else class="grid items-start gap-10 lg:grid-cols-[1fr_20rem]">
      <div class="space-y-8">
        <!-- Delivery / account -->
        <div>
          <h2 class="text-sm font-semibold">Delivery</h2>
          <div class="bg-card mt-3 rounded-xl border p-4 text-sm">
            <p class="font-medium">{{ user?.name }}</p>
            <p class="text-muted-foreground mt-0.5">{{ user?.email }}</p>
            <p class="text-muted-foreground mt-2">
              Your order is linked to this account. You'll get confirmation the moment it's placed.
            </p>
          </div>
        </div>

        <!-- Order review -->
        <div>
          <h2 class="text-sm font-semibold">
            Order review
            <span class="text-muted-foreground font-normal">({{ itemCount }})</span>
          </h2>
          <ul class="divide-border mt-3 divide-y">
            <li v-for="item in items" :key="item.id" class="flex items-center gap-4 py-4 first:pt-0">
              <ProductImage
                :src="item.product?.image_url"
                :alt="item.product?.name ?? 'Product'"
                class="size-16 shrink-0 rounded-lg border"
              />
              <div class="min-w-0 flex-1">
                <p class="line-clamp-1 text-sm font-medium">{{ item.product?.name ?? 'Product' }}</p>
                <p class="text-muted-foreground mt-0.5 text-sm tabular-nums">
                  Qty {{ item.quantity }}
                </p>
              </div>
              <span class="text-sm font-medium tabular-nums">
                {{ formatPrice((item.product?.price ?? 0) * item.quantity) }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Summary + place order -->
      <aside class="bg-card rounded-2xl border p-6 lg:sticky lg:top-20">
        <h2 class="text-base font-semibold">Summary</h2>
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
          <span class="text-sm font-medium">Total due</span>
          <span class="text-lg font-semibold tabular-nums">{{ formatPrice(subtotal) }}</span>
        </div>

        <Alert v-if="errorMessage" variant="destructive" class="mt-5">
          <AlertTitle>Couldn't place order</AlertTitle>
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <Button
          size="lg"
          class="mt-5 w-full active:translate-y-px"
          :disabled="placeOrder.isPending.value"
          @click="placeOrder.mutate()"
        >
          <Loader2 v-if="placeOrder.isPending.value" class="size-4 animate-spin" />
          {{ placeOrder.isPending.value ? 'Placing order' : 'Place order' }}
        </Button>
        <p class="text-muted-foreground mt-3 flex items-center justify-center gap-1.5 text-xs">
          <Lock class="size-3.5" />
          Secure, encrypted checkout
        </p>
      </aside>
    </div>
  </section>
</template>
