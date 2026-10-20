/**
 * The e-commerce module's route paths — the one place links and navigations read them from.
 *
 * Typed as plain `string` on purpose: the stub type-checks in place, where these routes are not in
 * the generated route tree yet (`kit:install` publishes `routes/_app/**` into `src/routes/_app/`).
 * A literal like `'/shop'` would only type-check after install; a `string` is accepted by `<Link to>`
 * and `navigate({ to })` in both places.
 */
export const shopPaths: {
  shop: string
  product: (id: string) => string
  cart: string
  checkout: string
  confirmation: (id: string) => string
} = {
  shop: '/shop',
  product: (id) => `/shop/${id}`,
  cart: '/cart',
  checkout: '/checkout',
  confirmation: (id) => `/checkout/confirmation/${id}`,
}
