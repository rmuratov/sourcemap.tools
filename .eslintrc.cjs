module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:perfectionist/recommended-natural',
    'plugin:testing-library/react',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'test'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'perfectionist', 'testing-library'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
}
