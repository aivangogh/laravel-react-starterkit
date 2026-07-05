/**
 * Centralised, typed TanStack Query key factories. Never inline query-key strings in composables —
 * import a factory from here so keys stay consistent and invalidation is precise.
 */

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...userKeys.lists(), params ?? {}] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...roleKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...roleKeys.all, 'detail', id] as const,
}

export const permissionKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionKeys.all, 'list'] as const,
}

export const activityKeys = {
  all: ['activity'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...activityKeys.lists(), params ?? {}] as const,
}
