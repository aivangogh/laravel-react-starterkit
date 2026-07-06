// E-commerce module (stub) — shared TypeScript contract for the frontend.
//
// Mirrors the backend API Resources under
// `backend/stubs/modules/ecommerce/app/Http/Resources/*` EXACTLY. Copied to
// `src/features/ecommerce/types.ts` by `kit:install` for the E-commerce preset;
// keep imports package-based (`@app/types`) or RELATIVE so the file is
// location-independent. Conventions: UUID ids via `Uuid`, timestamps via
// `IsoDateTime`, all money in INTEGER MINOR UNITS (cents). Nested relations are
// optional because the API only includes them when eager-loaded (`whenLoaded`).
// List endpoints return `Paginated<T>` (re-exported below).

import type { IsoDateTime, Uuid } from '@app/types'

export type { Paginated } from '@app/types'

/** A catalog category. Maps to `CategoryResource`. */
export interface Category {
  id: Uuid
  name: string
  slug: string
  description: string | null
  /** Present only when the `products` relation is eager-loaded. */
  products?: Product[]
  created_at: IsoDateTime
  updated_at: IsoDateTime
}

/** A catalog product. Maps to `ProductResource`. `price` is in minor units (cents). */
export interface Product {
  id: Uuid
  category_id: Uuid
  name: string
  slug: string
  description: string | null
  /** Price in integer minor units (cents). */
  price: number
  stock: number
  is_active: boolean
  /** First image in the Spatie `images` collection, or null when none is set. */
  image_url: string | null
  /** Present only when the `category` relation is eager-loaded. */
  category?: Category
  created_at: IsoDateTime
  updated_at: IsoDateTime
}

/** The authenticated user's cart. Maps to `CartResource`. */
export interface Cart {
  id: Uuid
  user_id: Uuid
  /** Present only when the `items` relation is eager-loaded. */
  items?: CartItem[]
  /**
   * Live sum of each line's (product price * quantity), in minor units (cents).
   * Present only once `items.product` is eager-loaded.
   */
  total?: number
  created_at: IsoDateTime
  updated_at: IsoDateTime
}

/** A single cart line. Maps to `CartItemResource`. Price is read live from `product`. */
export interface CartItem {
  id: Uuid
  cart_id: Uuid
  product_id: Uuid
  quantity: number
  /** Present only when the `product` relation is eager-loaded. */
  product?: Product
  created_at: IsoDateTime
  updated_at: IsoDateTime
}

/** The lifecycle statuses an order may hold (see `OrderController::STATUSES`). */
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

/** A placed order. Maps to `OrderResource`. `total` is snapshotted at checkout, in minor units (cents). */
export interface Order {
  id: Uuid
  user_id: Uuid
  status: OrderStatus
  /** Order total in integer minor units (cents), snapshotted at checkout. */
  total: number
  /** Present only when the `items` relation is eager-loaded. */
  items?: OrderItem[]
  created_at: IsoDateTime
  updated_at: IsoDateTime
}

/** A single order line. Maps to `OrderItemResource`. `name`/`unit_price` are checkout snapshots. */
export interface OrderItem {
  id: Uuid
  order_id: Uuid
  product_id: Uuid
  /** Product name snapshotted at checkout, so it survives later product edits. */
  name: string
  /** Unit price in integer minor units (cents), snapshotted at checkout. */
  unit_price: number
  quantity: number
  /** Present only when the `product` relation is eager-loaded. */
  product?: Product
  created_at: IsoDateTime
  updated_at: IsoDateTime
}
