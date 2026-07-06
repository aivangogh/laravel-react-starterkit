import { onBeforeUnmount, ref } from 'vue'

/**
 * Reveal-on-scroll for tasteful staggered entrances (MOTION dial ~4-5). Returns a
 * template `ref` to attach to the target element and a reactive `revealed` flag
 * that flips true the first time the element scrolls into view.
 *
 * Dependency-free: uses the native `IntersectionObserver`, so it resolves without
 * pulling a new package into the app. Honours `prefers-reduced-motion` by revealing
 * immediately (no transition to animate), and degrades to "always visible" when
 * `IntersectionObserver` is unavailable (SSR/older engines/jsdom).
 */
export function useReveal(options: { threshold?: number; rootMargin?: string } = {}) {
  const target = ref<HTMLElement | null>(null)
  const revealed = ref(false)
  let observer: IntersectionObserver | null = null

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Typed to match Vue's function-`ref` contract (accepts the element, a component
  // instance, or null); we only act on a real HTMLElement.
  function observe(node: unknown) {
    const el = node instanceof HTMLElement ? node : null
    target.value = el
    if (!el) return

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      revealed.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealed.value = true
            observer?.disconnect()
            observer = null
            break
          }
        }
      },
      { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? '0px 0px -8% 0px' },
    )
    observer.observe(el)
  }

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { target, revealed, observe }
}
