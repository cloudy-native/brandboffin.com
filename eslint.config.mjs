// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      '.cache/',
      'public/',
      'dist/',
      'cdk/cdk.out/',
      'cdk/dist/',
      'gatsby-config.js', // Assuming this is a JS file, not TS
      '.prettierrc.js',
      'eslint.config.mjs', // Updated from .js to .mjs
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Apply to all relevant files for consistent no-unused-vars behavior
    // This ensures that variables, arguments, and caught errors prefixed with '_' are ignored.
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'], // Covers JS and TS files
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error', // Keep severity as error
        {
          argsIgnorePattern: '^_',          // Ignore args starting with _
          varsIgnorePattern: '^_',          // Ignore variables starting with _
          caughtErrorsIgnorePattern: '^_', // Ignore caught errors starting with _
          ignoreRestSiblings: true,         // Ignore rest siblings like {a, ...rest} if rest is unused
        },
      ],
    },
  },
  {
    ...reactRecommended,
    files: ['src/**/*.{ts,tsx}'],
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      ...reactRecommended.languageOptions,
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...reactRecommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off', // Using TypeScript for prop types
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error', // User preference
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  prettierConfig, // Must be last to override other formatting rules
  {
    // Global config for all files (unless overridden)
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.es2021,
        }
    }
  }
);
