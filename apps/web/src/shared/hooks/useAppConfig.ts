import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import type { AppConfig } from '@app/types'
import { http } from '@/shared/lib/http'
import { configKeys } from '@/shared/lib/query-keys'

/** The public install config (`GET /api/config`). Shared by the hook and the route guard's prefetch. */
export const appConfigQueryOptions = queryOptions({
  queryKey: configKeys.detail(),
  queryFn: async () => {
    const { data } = await http.get<AppConfig>('/api/config')
    return data
  },
})

/**
 * Is an optional install `module` enabled by the resolved config? The single predicate behind both
 * `useAppConfig().isModuleEnabled` (for the nav) and {@link ensureModuleEnabled} (the guard).
 * `ecommerce` is enabled iff the preset is `ecommerce`; any other module falls back to its `features`
 * flag. An unresolved config (`undefined`) is treated as disabled (fail-closed).
 */
export function moduleEnabled(config: AppConfig | undefined, module: string): boolean {
  if (module === 'ecommerce') {
    return config?.preset === 'ecommerce'
  }
  return config?.features[module] === true
}

/**
 * Server state for the public install config — the preset and feature flags recorded in
 * `config/starterkit.php`. Returns `config` (`undefined` while loading), `preset`, `features`
 * (defaults to `{}`), `isEcommerce`, and `isModuleEnabled(module)` — the runtime module gate used by
 * the sidebar nav ({@link useNavItems}).
 */
export function useAppConfig() {
  const { data: config } = useQuery(appConfigQueryOptions)

  return {
    config,
    preset: config?.preset,
    features: config?.features ?? {},
    isEcommerce: config?.preset === 'ecommerce',
    isModuleEnabled: (module: string) => moduleEnabled(config, module),
  }
}

/**
 * The module gate for the route guard (outside React). Ensures the config is loaded via the shared
 * cache — so it never double-fetches with {@link useAppConfig} — then evaluates {@link moduleEnabled}.
 */
export async function ensureModuleEnabled(
  queryClient: QueryClient,
  module: string,
): Promise<boolean> {
  return moduleEnabled(await queryClient.ensureQueryData(appConfigQueryOptions), module)
}
