import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // React escapes all rendered text, so the only way to introduce XSS here is
      // to opt out of that escaping. Banning the opt-out is a stronger guarantee
      // than escaping input ourselves, which would double-encode stored text.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message:
            'dangerouslySetInnerHTML bypasses React escaping and is the XSS vector in this app. Render text as a child instead.',
        },
        {
          selector: 'MemberExpression[object.name="window"][property.name=/^(inner|outer)HTML$/]',
          message: 'Direct HTML assignment bypasses React escaping. Render text as a child instead.',
        },
        {
          selector: 'CallExpression[callee.name=/^(eval|Function)$/]',
          message: 'Dynamic code execution is not allowed.',
        },
      ],
    },
  },
])
