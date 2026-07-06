import type { Directive, DirectiveBinding } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth'

/**
 * `v-can` — permission-gate an element.
 *
 *   <button v-can="'users.create'">New user</button>          // hidden if lacking the permission
 *   <button v-can.disable="'users.delete'">Delete</button>     // disabled (not hidden) if lacking it
 *
 * Default behaviour hides the element (`display: none`), which also removes it from the a11y tree.
 * The `.disable` modifier keeps it visible but disabled instead.
 */

const ORIGINAL_DISPLAY = Symbol('v-can:display')

interface CanElement extends HTMLElement {
  [ORIGINAL_DISPLAY]?: string
}

function evaluate(el: CanElement, binding: DirectiveBinding<string>): void {
  const permission = binding.value
  const store = useAuthStore()
  // Delegate to the store's canonical rule so the super-admin bypass applies here too (a plain
  // `permissions.includes` would wrongly hide every gated control from the permission-less super-admin).
  const allowed = permission ? store.can(permission) : true

  if (binding.modifiers.disable) {
    if (allowed) {
      el.removeAttribute('disabled')
      el.removeAttribute('aria-disabled')
    } else {
      el.setAttribute('disabled', 'true')
      el.setAttribute('aria-disabled', 'true')
    }
    return
  }

  if (el[ORIGINAL_DISPLAY] === undefined) {
    el[ORIGINAL_DISPLAY] = el.style.display
  }
  el.style.display = allowed ? (el[ORIGINAL_DISPLAY] ?? '') : 'none'
}

export const vCan: Directive<CanElement, string> = {
  mounted: evaluate,
  updated: evaluate,
}
