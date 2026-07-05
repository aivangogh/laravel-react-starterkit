import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@app/types'
import { ensureCsrfCookie, http } from '@/shared/lib/http'

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

/**
 * The authenticated user + a `ready` flag the router guard reads synchronously.
 *
 * This is the ONE place server-derived data lives in Pinia — the user is session/client state
 * that gates navigation. Everything else server-side belongs in a TanStack Query composable.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  /** Flipped true after the first `fetchUser()`, so the guard never races the boot request. */
  const ready = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const permissions = computed(() => user.value?.permissions ?? [])
  const roles = computed(() => user.value?.roles ?? [])

  /** GET /api/user. Tolerates 401 (and any error) by resetting to the logged-out state. */
  async function fetchUser(): Promise<User | null> {
    try {
      const { data } = await http.get<User>('/api/user')
      user.value = data
    } catch {
      user.value = null
    } finally {
      ready.value = true
    }
    return user.value
  }

  async function login(credentials: LoginCredentials): Promise<User | null> {
    await ensureCsrfCookie()
    await http.post('/login', credentials)
    return fetchUser()
  }

  async function register(payload: RegisterPayload): Promise<User | null> {
    await ensureCsrfCookie()
    await http.post('/register', payload)
    return fetchUser()
  }

  async function logout(): Promise<void> {
    await ensureCsrfCookie()
    await http.post('/logout')
    user.value = null
  }

  return {
    user,
    ready,
    isAuthenticated,
    permissions,
    roles,
    fetchUser,
    login,
    register,
    logout,
  }
})
