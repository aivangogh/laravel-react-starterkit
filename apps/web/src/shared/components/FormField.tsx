import type { ReactNode } from 'react'
import { Label } from '@app/ui/components/ui/label'

/**
 * A labelled form control with its server-side (422) error and optional hint. The control itself is
 * passed as `children` — give it `id={htmlFor}` and `aria-invalid={!!error || undefined}`.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  labelAside,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  /** First validation message for this field, if any. */
  error?: string
  /** Muted helper text under the control. */
  hint?: ReactNode
  /** Rendered right-aligned on the label row (e.g. a "Forgot password?" link). */
  labelAside?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      {labelAside ? (
        <div className="flex items-center justify-between">
          <Label htmlFor={htmlFor}>{label}</Label>
          {labelAside}
        </div>
      ) : (
        <Label htmlFor={htmlFor}>{label}</Label>
      )}
      {children}
      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
