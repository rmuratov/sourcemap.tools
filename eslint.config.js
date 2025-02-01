// @ts-check

import eslint from '@eslint/js'
import configPrettier from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import testingLibraryPlugin from 'eslint-plugin-testing-library'
import tsEslintPlugin from 'typescript-eslint'

export default tsEslintPlugin.config(
  eslint.configs.recommended,
  ...tsEslintPlugin.configs.strictTypeChecked,
  ...tsEslintPlugin.configs.stylisticTypeChecked,
  {
    ...perfectionist.configs['recommended-natural'],
    rules: {
      ...perfectionist.configs['recommended-natural'].rules,
      'perfectionist/sort-modules': 0,
    },
  },
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
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
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
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    extends: [tsEslintPlugin.configs.disableTypeChecked],
    files: ['**/*.js'],
  },
  configPrettier,
)
