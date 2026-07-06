import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import type { AppConfig } from '@app/types'
import { http } from '@/shared/lib/http'
import { queryClient } from '@/shared/lib/query-client'
import { configKeys } from '@/shared/lib/query-keys'

/** Fetch the public install config. Shared by the reactive query and the guard's prefetch. */
async function fetchAppConfig(): Promise<AppConfig> {
  const { data } = await http.get<AppConfig>('/api/config')
  return data
}

/**
 * Is an optional install `module` enabled by the resolved config? The single predicate behind both
 * `useAppConfig().isModuleEnabled` (reactive, for the nav) and {@link ensureModuleEnabled} (the
 * guard). `ecommerce` is enabled iff the preset is `ecommerce`; any other module falls back to its
 * `features` flag. An unresolved config (`undefined`) is treated as disabled (fail-closed).
 */
function moduleEnabled(config: AppConfig | undefined, module: string): boolean {
  if (module === 'ecommerce') {
    return config?.preset === 'ecommerce'
  }
  return config?.features[module] === true
}

/**
 * Server state for the public install config (`GET /api/config`) — the preset and
 * feature flags recorded in `config/starterkit.php`. Read at boot (no auth needed)
 * so navigation can be gated to what the install provisioned.
 *
 * Returns reactive projections: `config` (the whole {@link AppConfig} or `undefined`
 * while loading), `preset`, `features` (defaults to `{}`), `isEcommerce`
 * (`preset === 'ecommerce'`), and `isModuleEnabled(module)` — the runtime module gate used
 * by the sidebar nav ({@link useNavItems}).
 */
export function useAppConfig() {
  const query = useQuery({
    queryKey: configKeys.detail(),
    queryFn: fetchAppConfig,
  })

  const config = computed(() => query.data.value)
  const preset = computed(() => query.data.value?.preset)
  const features = computed(() => query.data.value?.features ?? {})
  const isEcommerce = computed(() => query.data.value?.preset === 'ecommerce')

  return {
    config,
    preset,
    features,
    isEcommerce,
    isModuleEnabled: (module: string) => moduleEnabled(query.data.value, module),
  }
}

/**
 * The module gate for use OUTSIDE a component setup — specifically the router guard, where
 * `useQuery`/`inject` is unavailable. Ensures the config is loaded (mirrors the guard awaiting the
 * auth session) via the shared `queryClient` cache, then evaluates {@link moduleEnabled}. Shares
 * the cache with `useAppConfig`, so this never double-fetches.
 */
export async function ensureModuleEnabled(module: string): Promise<boolean> {
  const config = await queryClient.ensureQueryData({
    queryKey: configKeys.detail(),
    queryFn: fetchAppConfig,
  })
  return moduleEnabled(config, module)
}
