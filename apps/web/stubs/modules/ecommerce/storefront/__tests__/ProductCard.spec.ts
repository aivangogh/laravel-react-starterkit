import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Product } from '../../types'
import ProductCard from '../components/ProductCard.vue'

const RouterLinkStub = {
  props: ['to'],
  template: '<a><slot /></a>',
}

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

function mountCard(product: Product, props: Record<string, unknown> = {}) {
  return mount(ProductCard, {
    props: { product, ...props },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('ProductCard', () => {
  it('renders the name, category, and formatted price', () => {
    const wrapper = mountCard(makeProduct())
    expect(wrapper.text()).toContain('Trail Runner')
    expect(wrapper.text()).toContain('Footwear')
    // 12900 minor units -> 129.00 in the major unit.
    expect(wrapper.text()).toContain('129.00')
  })

  it('emits "add" with the product when the add button is clicked', async () => {
    const product = makeProduct()
    const wrapper = mountCard(product)

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('add')).toBeTruthy()
    expect(wrapper.emitted('add')![0][0]).toEqual(product)
  })

  it('shows a disabled sold-out action when out of stock', () => {
    const wrapper = mountCard(makeProduct({ stock: 0 }))
    const button = wrapper.get('button')
    expect(wrapper.text()).toContain('Sold out')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('reflects the adding and added states', () => {
    const adding = mountCard(makeProduct(), { adding: true })
    expect(adding.text()).toContain('Adding')

    const added = mountCard(makeProduct(), { added: true })
    expect(added.text()).toContain('Added')
  })
})
