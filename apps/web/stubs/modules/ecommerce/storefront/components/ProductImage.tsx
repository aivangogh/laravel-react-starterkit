import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@app/ui/lib/utils'

/**
 * Product imagery with a graceful fallback. `Product.image_url` is nullable and remote
 * URLs can 404, so a null/failed source degrades to a muted placeholder tile instead of
 * a broken-image glyph. Shared across the card, detail, cart, and order surfaces.
 */
export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  large = false,
}: {
  src: string | null | undefined
  alt: string
  /** Tailwind aspect + rounding utilities for the wrapper. */
  className?: string
  /** Extra classes for the <img> itself (e.g. a group-hover zoom transform). */
  imgClassName?: string
  /** Larger placeholder icon for hero/detail contexts. */
  large?: boolean
}) {
  // Remember WHICH source failed, so a new `src` (navigating between products) retries.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  return (
    <div className={cn('bg-muted text-muted-foreground relative overflow-hidden', className)}>
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn('h-full w-full object-cover', imgClassName)}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageOff className={large ? 'size-10' : 'size-6'} aria-hidden="true" />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  )
}
