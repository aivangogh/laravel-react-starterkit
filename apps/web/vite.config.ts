import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Read a `KEY=value` from a dotenv-style file, relative to this config. Best-effort: returns undefined
// if the file or key is absent. Strips surrounding quotes; we don't need `${...}` interpolation here.
function readEnvValue(fileUrl: string, key: string): string | undefined {
  try {
    const text = fs.readFileSync(fileURLToPath(new URL(fileUrl, import.meta.url)), 'utf8')
    return text
      .match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]
      .trim()
      .replace(/^["']|["']$/g, '')
  } catch {
    return undefined
  }
}

// The API origin is defined ONCE in backend/.env (SERVER_HOST/SERVER_PORT). In the monorepo we derive
// the SPA's API URL from there so changing the backend port needs zero edits on the web side. An
// explicit VITE_API_URL — the deploy environment or apps/web/.env — always wins, which is how a
// standalone SPA build (no backend/.env) points at its API.
function resolveApiUrl(): string {
  const explicit = process.env.VITE_API_URL || readEnvValue('./.env', 'VITE_API_URL')
  if (explicit) return explicit
  const host = readEnvValue('../../backend/.env', 'SERVER_HOST') || 'localhost'
  const port = readEnvValue('../../backend/.env', 'SERVER_PORT') || '8000'
  return `http://${host}:${port}`
}

const apiUrl = resolveApiUrl()

// Aliases mirror `tsconfig.json` `paths`. `@app/ui` and `@app/types` resolve to
// package SOURCE so Vite transpiles them (shadcn-vue components are consumed as source).
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    // Feed the resolved API origin to http.ts's `import.meta.env.VITE_API_URL`, so it works even when
    // VITE_API_URL isn't set in apps/web/.env (derived from backend/.env instead).
    'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
  },
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
