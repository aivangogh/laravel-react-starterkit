import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import type { AppConfig } from '@app/types'
import { http } from '@/shared/lib/http'
import { configKeys } from '@/shared/lib/query-keys'

/**
 * Server state for the public install config (`GET /api/config`) — the preset and
 * feature flags recorded in `config/starterkit.php`. Read at boot (no auth needed)
 * so navigation can be gated to what the install provisioned.
 *
 * Returns reactive projections: `config` (the whole {@link AppConfig} or `undefined`
 * while loading), `preset`, `features` (defaults to `{}`), and `isEcommerce`
 * (`preset === 'ecommerce'`).
 */
export function useAppConfig() {
  const query = useQuery({
    queryKey: configKeys.detail(),
    queryFn: async () => {
      const { data } = await http.get<AppConfig>('/api/config')
      return data
    },
  })

  const config = computed(() => query.data.value)
  const preset = computed(() => query.data.value?.preset)
  const features = computed(() => query.data.value?.features ?? {})
  const isEcommerce = computed(() => query.data.value?.preset === 'ecommerce')

  return { config, preset, features, isEcommerce }
}
