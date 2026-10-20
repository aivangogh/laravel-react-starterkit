import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount rendered trees between tests (vitest runs without globals, so RTL can't auto-register this).
afterEach(cleanup)

// jsdom has no PointerEvent; Base UI dispatches one on click (e.g. Checkbox). MouseEvent is close enough.
window.PointerEvent ??= MouseEvent as unknown as typeof PointerEvent
