import { Link } from '@tanstack/react-router'
import { Check, Loader2, Plus } from 'lucide-react'
import { Button } from '@app/ui/components/ui/button'
import type { Product } from '../../types'
import { formatMoney } from '../../lib/money'
import { shopPaths } from '../../lib/paths'
import { ProductImage } from './ProductImage'

/**
 * A single product tile in the shop grid: framed imagery that zooms on hover, then a
 * quiet type block (category, name, price) and an add-to-cart action. Presentational —
 * the add is reported upward via `onAdd` so the page owns the one cart mutation.
 */
export function ProductCard({
  product,
  adding = false,
  added = false,
  onAdd,
}: {
  product: Product
  /** This product's add request is in flight. */
  adding?: boolean
  /** This product was just added (transient confirmation). */
  added?: boolean
  onAdd: (product: Product) => void
}) {
  const inStock = product.stock > 0

  return (
    <article className="group flex flex-col">
      <Link
        to={shopPaths.product(product.id)}
        className="focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="aspect-[4/5] rounded-xl border transition-shadow duration-300 group-hover:shadow-md"
          imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        {product.category && (
          <p className="text-muted-foreground text-xs tracking-wide">{product.category.name}</p>
        )}
        <Link
          to={shopPaths.product(product.id)}
          className="hover:text-muted-foreground mt-0.5 line-clamp-1 text-sm font-medium transition-colors"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tabular-nums">{formatMoney(product.price)}</span>

          <Button
            size="sm"
            variant={added ? 'secondary' : 'default'}
            disabled={!inStock || adding}
            className="active:translate-y-px"
            onClick={() => onAdd(product)}
          >
            {!inStock ? (
              'Sold out'
            ) : adding ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Adding
              </>
            ) : added ? (
              <>
                <Check className="size-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}
