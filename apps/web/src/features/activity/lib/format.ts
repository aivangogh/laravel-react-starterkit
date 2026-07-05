import type { Activity } from '@app/types'

/** Locale-aware date+time formatter shared by the activity table and detail dialog. */
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Format an ISO timestamp for display; returns an em-dash for empty values. */
export function formatActivityDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date)
}

/** Take the class basename of a fully-qualified morph type, e.g. `App\\Models\\User` → `User`. */
export function modelBasename(type: string | null): string | null {
  if (!type) return null
  return type.split('\\').pop() ?? type
}

/** Shorten a UUID for compact display while keeping it recognisable. */
function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id
}

/**
 * Friendly label for the actor behind an activity. Falls back to "System" for
 * events with no causer (console commands, migrations, framework actions).
 */
export function causerLabel(activity: Pick<Activity, 'causer_type' | 'causer_id'>): string {
  const model = modelBasename(activity.causer_type)
  if (!model) return 'System'
  return activity.causer_id ? `${model} #${shortId(activity.causer_id)}` : model
}
