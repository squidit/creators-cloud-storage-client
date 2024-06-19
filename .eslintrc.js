module.exports = {
  env: {
    es2023: true,
    node: true
  },
  root: true,
  ignorePatterns: ['**/libraries/**'],
  extends: 'standard-with-typescript',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.eslint.json'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': ['warn'],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-misused-promises': ['off', { checksVoidReturn: false }],
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'no-multi-spaces': ['off', { ignoreEOLComments: true, exceptions: { VariableDeclarator: false, ImportDeclaration: true } }],
    'padding-line-between-statements': ['error', { blankLine: 'never', prev: 'import', next: 'import' }]
  }
}
