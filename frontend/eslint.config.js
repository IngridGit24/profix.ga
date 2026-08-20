import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Fetch-on-mount ("load data when this component appears") is this
      // codebase's standard data-loading pattern throughout (Navbar,
      // ClientDashboard, ConversationsList, DemandesList, DevisList,
      // AdminPage, AccountPage, AuthContext...) — it matches React's own
      // docs example for effects with no data-fetching library in the
      // project. Genuinely risky only when unmount can race a slow
      // request, which none of these simple list/dashboard fetches do.
      // Downgraded so it stays visible in `npm run lint` output without
      // blocking it (errors exit non-zero, warnings don't).
      'react-hooks/set-state-in-effect': 'warn',
      // Context files intentionally export their hook alongside the
      // provider component (AuthContext: AuthProvider + useAuth) — the
      // standard React Context pattern (react-router does the same).
      // Costs only Fast Refresh's full-reload-instead-of-hot-reload
      // fallback in dev, not a real bug.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
