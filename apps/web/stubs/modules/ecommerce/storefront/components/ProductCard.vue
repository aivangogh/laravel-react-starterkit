<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Check, Loader2, Plus } from 'lucide-vue-next'
import { Button } from '@app/ui/components/ui/button'
import type { Product } from '../../types'
import { formatPrice } from '../lib/money'
import ProductImage from './ProductImage.vue'

/**
 * A single product tile in the shop grid: framed imagery that zooms on hover, then a
 * quiet type block (category, name, price) and an add-to-cart action. Presentational —
 * the add is emitted upward so the page owns the one cart mutation.
 */
const props = defineProps<{
  product: Product
  /** This product's add request is in flight. */
  adding?: boolean
  /** This product was just added (transient confirmation). */
  added?: boolean
}>()

const emit = defineEmits<{ add: [product: Product] }>()

const inStock = computed(() => props.product.stock > 0)
</script>

<template>
  <article class="group flex flex-col">
    <RouterLink
      :to="{ name: 'ecommerce.shop.product', params: { id: product.id } }"
      class="focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <ProductImage
        :src="product.image_url"
        :alt="product.name"
        class="aspect-[4/5] rounded-xl border transition-shadow duration-300 group-hover:shadow-md"
        img-class="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
    </RouterLink>

    <div class="mt-3 flex flex-1 flex-col">
      <p v-if="product.category" class="text-muted-foreground text-xs tracking-wide">
        {{ product.category.name }}
      </p>
      <RouterLink
        :to="{ name: 'ecommerce.shop.product', params: { id: product.id } }"
        class="hover:text-muted-foreground mt-0.5 line-clamp-1 text-sm font-medium transition-colors"
      >
        {{ product.name }}
      </RouterLink>

      <div class="mt-2 flex items-center justify-between gap-2">
        <span class="text-sm font-semibold tabular-nums">{{ formatPrice(product.price) }}</span>

        <Button
          size="sm"
          :variant="added ? 'secondary' : 'default'"
          :disabled="!inStock || adding"
          class="active:translate-y-px"
          @click="emit('add', product)"
        >
          <template v-if="!inStock">Sold out</template>
          <template v-else-if="adding">
            <Loader2 class="size-4 animate-spin" />
            Adding
          </template>
          <template v-else-if="added">
            <Check class="size-4" />
            Added
          </template>
          <template v-else>
            <Plus class="size-4" />
            Add
          </template>
        </Button>
      </div>
    </div>
  </article>
</template>
