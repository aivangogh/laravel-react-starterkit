import { getErrorMessage, getValidationErrors } from '@/shared/lib/http'

/** Read a submitted form's fields as strings (uncontrolled inputs + `FormData`). */
export function formValues(form: HTMLFormElement): Record<string, string> {
  return Object.fromEntries(
    [...new FormData(form)].map(([key, value]) => [key, typeof value === 'string' ? value : '']),
  )
}

/**
 * Split a mutation error for a form: `fields` holds the first 422 message per field, and `alert` is
 * the top-level message — only when there are no field errors to show inline (so it never repeats).
 */
export function formErrors(error: unknown): { fields: Record<string, string>; alert: string } {
  if (!error) return { fields: {}, alert: '' }
  const fields = Object.fromEntries(
    Object.entries(getValidationErrors(error)).map(([key, messages]) => [key, messages[0] ?? '']),
  )
  return { fields, alert: Object.keys(fields).length ? '' : getErrorMessage(error) }
}
