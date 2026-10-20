/**
 * Money helpers for the e-commerce module — the single home for the currency/locale rule.
 *
 * The API speaks INTEGER MINOR UNITS (cents) everywhere (`Product.price`, `Cart.total`,
 * `Order.total`, `OrderItem.unit_price`). The UI must never show a raw cent count, so every amount
 * passes through `formatMoney` before display; forms edit major units and convert back with
 * `majorToMinor`. Currency is a display concern the API does not carry — swap `CURRENCY` if the kit
 * is localised.
 */
const CURRENCY = 'USD'

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: CURRENCY,
})

/** Format integer minor units as a localized currency string (`1299 → "$12.99"`). Non-finite → zero. */
export function formatMoney(minorUnits: number): string {
  return currencyFormatter.format((Number.isFinite(minorUnits) ? minorUnits : 0) / 100)
}

/** Convert integer minor units to a plain major-unit number for pre-filling an input (`1299 → 12.99`). */
export function minorToMajorNumber(minor: number): number {
  return minor / 100
}

/** Convert a major-unit amount to integer minor units, rounding to the nearest cent (`12.99 → 1299`). */
export function majorToMinor(major: number): number {
  return Math.round(major * 100)
}
