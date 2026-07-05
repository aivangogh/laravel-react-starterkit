import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from '@/app/App.vue'
import { router } from '@/app/router'
import { queryClient } from '@/shared/lib/query-client'
import { vCan } from '@/shared/directives/can'
import { useAuthStore } from '@/features/auth/stores/auth'
import '@/assets/main.css'

async function bootstrap() {
  const app = createApp(App)

  app.use(createPinia())
  app.use(VueQueryPlugin, { queryClient })
  app.directive('can', vCan)

  // Resolve the session ONCE before mounting so the router guard reads `ready` synchronously.
  await useAuthStore().fetchUser()

  app.use(router)
  app.mount('#app')
}

void bootstrap()
