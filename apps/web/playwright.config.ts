import { defineConfig, devices } from '@playwright/test'

// E2E of the live Sanctum cookie flow runs against `localhost` (never 127.0.0.1).
// `webServer` boots the Vite dev server; the API must be served separately (see README).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
