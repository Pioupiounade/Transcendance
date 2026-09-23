import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Frontières de modules (frontend/CLAUDE.md, « Structure des dossiers »).
// Sens unique : app → features → shared. Une feature n'est importable que par son index.ts.
const featureInternals = {
  group: ['@/features/*/*', '**/features/*/*'],
  message: "Importer une feature uniquement par son index.ts : '@/features/<name>'.",
}
const appLayer = {
  group: ['@/app', '@/app/*', '**/app/*'],
  message: "features/ et shared/ ne dépendent jamais de app/ (composition root).",
}
const featuresLayer = {
  group: ['@/features', '@/features/*', '**/features/*'],
  message: "shared/ ne connaît aucun domaine métier : pas d'import depuis features/.",
}

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
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [featureInternals] }] },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [featureInternals, appLayer] }] },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [featureInternals, appLayer, featuresLayer] }] },
  },
])
