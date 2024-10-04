import pluginJs from "@eslint/js";
import eslintPluginStylistic from "@stylistic/eslint-plugin";
import eslintPluginDepend from 'eslint-plugin-depend';
// import eslintPluginJest from "eslint-plugin-jest";
import eslintPluginNode from 'eslint-plugin-n';
import eslintPluginPackageJson from "eslint-plugin-package-json/configs/recommended";
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginRegexp from "eslint-plugin-regexp";
import eslintPluginSecurity from "eslint-plugin-security";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { files: ["**/*.{js,mjs,cjs,ts}", "package.json"], name: 'creators/files' },
  { languageOptions: { globals: { ...globals.node } }, name: 'creators/globals' },
  {
    languageOptions: {
      parserOptions: {
        sourceType: "module",
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    name: 'creators/parser-options',
  },
  { name: 'creators/plugins', plugins: { perfectionist: eslintPluginPerfectionist } },
  { name: 'eslint/js', ...pluginJs.configs.recommended },
  eslintPluginNode.configs['flat/recommended'],
  ...tseslint.configs.strictTypeChecked.map(config => ({ ...config, files: ["**/*.ts"], })),
  ...tseslint.configs.stylisticTypeChecked.map(config => ({ ...config, files: ["**/*.ts"], })),
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": ["error", { allowConstantLoopConditions: true }],
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    }
  },
  { name: 'depend', ...eslintPluginDepend.configs['flat/recommended'] },
  eslintPluginUnicorn.configs['flat/recommended'],
  eslintPluginSecurity.configs.recommended,
  // eslintPluginJest.configs['flat/recommended'],
  eslintPluginRegexp.configs['flat/recommended'],
  eslintPluginStylistic.configs['recommended-flat'],
  eslintPluginPackageJson,
  {
    name: 'creators/custom-rules', rules: {
      'no-restricted-exports': ['error', { restrictDefaultExports: {direct: true} }],
      'depend/ban-dependencies': 'warn',
      'object-shorthand': 'error',
      'n/no-missing-import': 'off',
      'n/no-process-env': 'error',
      'n/no-unpublished-import': 'off',
      'perfectionist/sort-array-includes': ['error', { order: 'asc', type: 'natural' }],
      'perfectionist/sort-interfaces': ['error', { order: 'asc', type: 'natural' }],
      'perfectionist/sort-object-types': ['error', { order: 'asc', type: 'natural' }],
      'perfectionist/sort-objects': ['error', { order: 'asc', partitionByComment: true, type: 'natural' }],
      'perfectionist/sort-union-types': ['error', { groups: ['unknown', 'nullish'], order: 'asc', type: 'natural' }],
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': ['error', { allowList: { db: true, Db: true, env: true, envs: true }, extendDefaultReplacements: true }],
      'unicorn/throw-new-error': 'off',
      'security/detect-object-injection': 'off'
    }
  },
  { name: 'creators/ignores', ignores: ["libraries/**/*", "dist/**/*", "coverage/**/*", "eslint.config.mjs", "jest.config.js"] }
]