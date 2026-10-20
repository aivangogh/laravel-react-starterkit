import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Product } from '../../types'
import { ProductCard } from '../components/ProductCard'

// The card links to the product page; a plain anchor stands in for the router's `Link`.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}))

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    category_id: 'c1',
    name: 'Trail Runner',
    slug: 'trail-runner',
    description: 'A shoe.',
    price: 12900,
    stock: 8,
    is_active: true,
    image_url: null,
    category: {
      id: 'c1',
      name: 'Footwear',
      slug: 'footwear',
      description: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Product
}

function renderCard(product: Product, props: { adding?: boolean; added?: boolean } = {}) {
  const onAdd = vi.fn()
  const view = render(<ProductCard product={product} onAdd={onAdd} {...props} />)
  return { ...view, onAdd }
}

describe('ProductCard', () => {
  it('renders the name, category, and formatted price', () => {
    const { container } = renderCard(makeProduct())
    expect(container).toHaveTextContent('Trail Runner')
    expect(container).toHaveTextContent('Footwear')
    // 12900 minor units -> 129.00 in the major unit.
    expect(container).toHaveTextContent('129.00')
  })

  it('reports "add" with the product when the add button is clicked', async () => {
    const product = makeProduct()
    const { onAdd } = renderCard(product)

    await userEvent.click(screen.getByRole('button'))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith(product)
  })

  it('shows a disabled sold-out action when out of stock', () => {
    const { container } = renderCard(makeProduct({ stock: 0 }))
    expect(container).toHaveTextContent('Sold out')
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('reflects the adding and added states', () => {
    const adding = renderCard(makeProduct(), { adding: true })
    expect(adding.container).toHaveTextContent('Adding')
    adding.unmount()

    const added = renderCard(makeProduct(), { added: true })
    expect(added.container).toHaveTextContent('Added')
  })
})
