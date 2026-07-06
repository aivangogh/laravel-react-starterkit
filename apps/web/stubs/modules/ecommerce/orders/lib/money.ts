/**
 * Money formatting for the e-commerce module. Every amount in the API contract is an INTEGER in
 * minor units (cents); this is the single place that converts to a major-unit display string, so
 * the orders page and the detail dialog format identically.
 *
 * Currency is a display concern the API does not carry, so the starter kit defaults to USD — swap
 * the `currency` here (or thread it through) if a build needs another.
 */
const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
})

/** Format an integer amount in minor units (cents) as a localized major-unit currency string. */
export function formatMoney(minorUnits: number): string {
  return currencyFormatter.format(minorUnits / 100)
}
