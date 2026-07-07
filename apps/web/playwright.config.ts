import { defineConfig, devices } from '@playwright/test'

// End-to-end tests drive the real SPA against the live stack, so they exercise the genuine Sanctum
// cookie session — nothing is mocked. Everything runs against `localhost` (never 127.0.0.1) so the
// session cookie, which is scoped to `localhost`, is sent.
//
// Prerequisites (see e2e/README.md): the database + API must already be running —
//   pnpm db:up                                  # Postgres + Redis
//   cd backend && php artisan migrate:fresh --seed   # seeds the super-admin (admin@example.com)
//   cd backend && php artisan serve --host=localhost --port=8000
// `webServer` below only boots the Vite dev server (and reuses one if it is already up).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // The API is `php artisan serve` (PHP's built-in single-threaded server), so tests run serially:
  // firing parallel auth chains (csrf -> /login -> /api/user) at it causes request queueing and
  // timeouts. On a concurrent API (e.g. Linux with PHP_CLI_SERVER_WORKERS) this can be raised.
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
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
  // Taller than the 720px Desktop Chrome default so modal dialogs (e.g. the user form with its role
  // checkboxes) fit on screen and their submit buttons stay in the viewport.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 1000 } } },
  ],
})
