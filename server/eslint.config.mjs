import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierRecommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'off',
      // Test files declare hoisted `var mockX = jest.fn()` so jest.mock()
      // factories (hoisted to the top of the module) can reference them.
      // Converting to let/const puts them in the TDZ and breaks the mocks.
      'no-var': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/preserve-caught-error': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-useless-assignment': 'off',
      'preserve-caught-error': 'off',
    },
  }
);
