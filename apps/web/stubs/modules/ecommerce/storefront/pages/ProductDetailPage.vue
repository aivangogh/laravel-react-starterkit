<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Check, Loader2, RotateCcw, ShieldCheck, Truck } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@app/ui/components/ui/alert'
import { Badge } from '@app/ui/components/ui/badge'
import { Button } from '@app/ui/components/ui/button'
import { Separator } from '@app/ui/components/ui/separator'
import { Skeleton } from '@app/ui/components/ui/skeleton'
import { useProduct } from '../composables/useCatalog'
import { formatPrice } from '../lib/money'
import { useCart } from '../../cart/composables/useCart'
import ProductImage from '../components/ProductImage.vue'
import QuantityStepper from '../components/QuantityStepper.vue'

const route = useRoute()
const router = useRouter()
const productId = computed(() => String(route.params.id))

const { data: product, isPending, isError, refetch } = useProduct(productId)

const quantity = ref(1)
const inStock = computed(() => (product.value?.stock ?? 0) > 0)
const lowStock = computed(() => {
  const stock = product.value?.stock ?? 0
  return stock > 0 && stock <= 5
})

// Reset the chosen quantity whenever a different product resolves.
watch(product, () => {
  quantity.value = 1
})

const { addItem } = useCart()
const added = ref(false)
let addedTimer: ReturnType<typeof setTimeout> | undefined

function addToCart() {
  if (!product.value) return
  addItem.mutate(
    { product_id: product.value.id, quantity: quantity.value },
    {
      onSuccess: () => {
        added.value = true
        clearTimeout(addedTimer)
        addedTimer = setTimeout(() => (added.value = false), 2500)
      },
    },
  )
}

const trust = [
  { icon: Truck, label: 'Free shipping on every order' },
  { icon: RotateCcw, label: '30-day painless returns' },
  { icon: ShieldCheck, label: 'Secure checkout' },
]
</script>

<template>
  <section class="space-y-6">
    <button
      type="button"
      class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      @click="router.push({ name: 'ecommerce.shop' })"
    >
      <ArrowLeft class="size-4" />
      Back to shop
    </button>

    <!-- Error -->
    <Alert v-if="isError" variant="destructive">
      <AlertTitle>Couldn't load this product</AlertTitle>
      <AlertDescription>
        It may have been removed.
        <button class="underline underline-offset-4" @click="() => refetch()">Try again</button>
      </AlertDescription>
    </Alert>

    <!-- Loading -->
    <div v-else-if="isPending" class="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <Skeleton class="aspect-square rounded-2xl" />
      <div class="space-y-4 py-2">
        <Skeleton class="h-3 w-20" />
        <Skeleton class="h-8 w-3/4" />
        <Skeleton class="h-6 w-24" />
        <Skeleton class="h-24 w-full" />
        <Skeleton class="h-11 w-full max-w-xs" />
      </div>
    </div>

    <!-- Detail -->
    <div v-else-if="product" class="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div class="lg:sticky lg:top-20 lg:self-start">
        <ProductImage
          :src="product.image_url"
          :alt="product.name"
          large
          class="aspect-square w-full rounded-2xl border"
        />
      </div>

      <div class="flex flex-col">
        <p v-if="product.category" class="text-muted-foreground text-sm">
          {{ product.category.name }}
        </p>
        <h1 class="mt-1 text-3xl font-semibold tracking-tight text-balance">
          {{ product.name }}
        </h1>

        <div class="mt-4 flex items-center gap-3">
          <span class="text-2xl font-semibold tabular-nums">{{ formatPrice(product.price) }}</span>
          <Badge v-if="!inStock" variant="secondary">Sold out</Badge>
          <Badge v-else-if="lowStock" variant="outline" class="text-muted-foreground">
            Only {{ product.stock }} left
          </Badge>
        </div>

        <p
          v-if="product.description"
          class="text-muted-foreground mt-6 max-w-prose text-sm leading-relaxed whitespace-pre-line"
        >
          {{ product.description }}
        </p>

        <Separator class="my-7" />

        <div class="flex flex-wrap items-center gap-3">
          <QuantityStepper
            v-model="quantity"
            :max="product.stock || 1"
            :disabled="!inStock"
            :label="product.name"
          />
          <Button
            size="lg"
            class="min-w-44 flex-1 active:translate-y-px sm:flex-none"
            :disabled="!inStock || addItem.isPending.value"
            @click="addToCart"
          >
            <template v-if="addItem.isPending.value">
              <Loader2 class="size-4 animate-spin" />
              Adding
            </template>
            <template v-else-if="added">
              <Check class="size-4" />
              Added to cart
            </template>
            <template v-else>
              {{ inStock ? 'Add to cart' : 'Sold out' }}
            </template>
          </Button>
        </div>

        <Transition
          enter-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          leave-active-class="transition-opacity duration-200"
          leave-to-class="opacity-0"
        >
          <RouterLink
            v-if="added"
            :to="{ name: 'ecommerce.cart' }"
            class="text-muted-foreground hover:text-foreground mt-3 inline-block text-sm underline underline-offset-4"
          >
            View cart
          </RouterLink>
        </Transition>

        <ul class="text-muted-foreground mt-8 grid gap-2.5 text-sm">
          <li v-for="point in trust" :key="point.label" class="flex items-center gap-2.5">
            <component :is="point.icon" class="size-4 shrink-0" />
            {{ point.label }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
