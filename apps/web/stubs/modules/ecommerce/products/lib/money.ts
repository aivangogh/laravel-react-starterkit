/**
 * Money helpers for the catalog. Product prices travel over the API as INTEGER MINOR units
 * (cents); the UI shows and edits them in major units. Both conversions live here so the table
 * (display) and the form (pre-fill + submit) agree on the same rounding rule.
 */

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
})

/** Format integer minor units as a localized currency string, e.g. `1299 → "$12.99"`. */
export function formatMinorToMajor(minor: number): string {
  return currencyFormatter.format(minor / 100)
}

/** Convert integer minor units to a plain major-unit number for pre-filling an input (`1299 → 12.99`). */
export function minorToMajorNumber(minor: number): number {
  return minor / 100
}

/** Convert a major-unit amount to integer minor units, rounding to the nearest cent (`12.99 → 1299`). */
export function majorToMinor(major: number): number {
  return Math.round(major * 100)
}
