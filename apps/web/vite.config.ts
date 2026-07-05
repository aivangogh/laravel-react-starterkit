import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Aliases mirror `tsconfig.json` `paths`. `@app/ui` and `@app/types` resolve to
// package SOURCE so Vite transpiles them (shadcn-vue components are consumed as source).
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@app/ui': fileURLToPath(new URL('../../packages/ui/src', import.meta.url)),
      '@app/types': fileURLToPath(new URL('../../packages/types/src/index.ts', import.meta.url)),
    },
  },
  server: {
    // Serve on localhost (NOT 127.0.0.1) so Sanctum's localhost-scoped cookies round-trip.
    host: 'localhost',
    port: 5173,
  },
})
