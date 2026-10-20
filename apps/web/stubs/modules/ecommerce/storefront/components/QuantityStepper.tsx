import { Minus, Plus } from 'lucide-react'
import { cn } from '@app/ui/lib/utils'

const buttonClass = cn(
  'text-muted-foreground hover:text-foreground grid place-items-center transition-colors',
  'focus-visible:ring-ring/50 outline-none focus-visible:ring-2',
  'disabled:hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40',
)

/**
 * A compact - / value / + quantity control. Presentational: `value` in, clamped changes
 * out via `onChange`. Reused by the product detail page (pre-add quantity) and the
 * cart line items (live quantity update), so the increment/decrement/clamp rules live
 * in one place.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  size = 'default',
  className,
  label,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  /** `sm` for dense cart rows, `default` for the detail page. */
  size?: 'sm' | 'default'
  className?: string
  /** Accessible label prefix, e.g. the product name. */
  label?: string
}) {
  const isSmall = size === 'sm'
  const canDecrement = !disabled && value > min
  const canIncrement = !disabled && (max === undefined || value < max)

  function setValue(next: number) {
    const clamped = Math.max(min, Math.min(max ?? Number.POSITIVE_INFINITY, next))
    if (clamped !== value) onChange(clamped)
  }

  const buttonSize = isSmall ? 'size-7' : 'size-9'
  const iconSize = isSmall ? 'size-3.5' : 'size-4'

  return (
    <div
      className={cn(
        'border-input inline-flex items-center rounded-md border',
        disabled && 'opacity-50',
        className,
      )}
      role="group"
      aria-label={label ? `Quantity for ${label}` : 'Quantity'}
    >
      <button
        type="button"
        className={cn(buttonClass, 'rounded-l-md', buttonSize)}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
        onClick={() => setValue(value - 1)}
      >
        <Minus className={iconSize} />
      </button>
      <span
        className={cn(
          'text-center text-sm font-medium tabular-nums select-none',
          isSmall ? 'w-8' : 'w-11',
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(buttonClass, 'rounded-r-md', buttonSize)}
        disabled={!canIncrement}
        aria-label="Increase quantity"
        onClick={() => setValue(value + 1)}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  )
}
