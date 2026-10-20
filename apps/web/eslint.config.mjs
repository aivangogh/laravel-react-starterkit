// Flat ESLint config for `web`, extending the shared workspace base (@app/config/eslint).
import base from '@app/config/eslint'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/routeTree.gen.ts',
    ],
  },
  ...base,
  {
    // Build/e2e config files execute in Node.
    files: ['*.config.{ts,mjs}', 'e2e/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
