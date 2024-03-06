// @ts-check

import eslint from '@eslint/js'
import configPrettier from 'eslint-config-prettier'
import perfectionistNatural from 'eslint-plugin-perfectionist/configs/recommended-natural'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import testingLibraryPlugin from 'eslint-plugin-testing-library'
import tsEslintPlugin from 'typescript-eslint'

export default tsEslintPlugin.config(
  eslint.configs.recommended,
  ...tsEslintPlugin.configs.strict,
  ...tsEslintPlugin.configs.stylistic,
  perfectionistNatural,
  {
    files: ['src/**/*.{ts,tsx}'],
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    plugins: {
      'testing-library': testingLibraryPlugin,
    },
    rules: {
      ...testingLibraryPlugin.configs.react.rules,
    },
  },
  configPrettier,
)
