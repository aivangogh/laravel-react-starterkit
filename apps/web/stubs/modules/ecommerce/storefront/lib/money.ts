// Money formatting for the e-commerce module.
//
// The API speaks INTEGER MINOR UNITS (cents) everywhere (`Product.price`,
// `Cart.total`, `Order.total`, `OrderItem.unit_price`). The UI must never show a
// raw cent count, so every price passes through `formatPrice` before display.
// Kept here in the catalog sub-feature as the single canonical home the cart and
// checkout sub-features import from, so the currency/locale rule lives in one
// place. Swap `CURRENCY` if the kit is localised.

const CURRENCY = 'USD'

const priceFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: CURRENCY,
})

/**
 * Format an integer minor-unit amount (cents) as a currency string.
 * `1299` -> `$12.99`. Non-finite input degrades to the zero amount.
 */
export function formatPrice(minorUnits: number): string {
  const amount = Number.isFinite(minorUnits) ? minorUnits : 0
  return priceFormatter.format(amount / 100)
}
