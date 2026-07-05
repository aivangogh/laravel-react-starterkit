// Flat ESLint config for `web`, extending the shared workspace base (@app/config/eslint).
import base from '@app/config/eslint'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },
  ...base,
  {
    files: ['**/*.vue'],
    rules: {
      // `App` is an allowed single-word root component name.
      'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
      // Formatting is owned by Prettier — disable the eslint-plugin-vue stylistic rules
      // that conflict with it (attribute wrapping, content newlines, self-closing, etc.).
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/attributes-order': 'off',
    },
  },
  {
    // Build/e2e config files execute in Node.
    files: ['*.config.{ts,mjs}', 'e2e/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
