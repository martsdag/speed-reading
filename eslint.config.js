import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import pluginJs from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginHtml from 'eslint-plugin-html';

export default [
  {
    name: 'ignores',
    ignores: ['dist/', '**/*.css'],
  },
  {
    name: 'js: recommended',
    ...pluginJs.configs.recommended,
  },
  {
    name: 'prettier: recommended',
    ...eslintPluginPrettierRecommended,
  },
  {
    name: 'global languageOptions',
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    name: 'files pattern',
    files: ['**/*.{js,mjs,cjs,css,html}'],
  },
  {
    name: 'stylistic',
    plugins: {
      '@stylistic/js': stylistic,
      html: eslintPluginHtml,
    },
    rules: {
      '@stylistic/js/semi': ['error', 'always'],
      '@stylistic/js/block-spacing': ['error', 'always'],
      '@stylistic/js/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/js/no-mixed-operators': 'error',
      '@stylistic/js/lines-around-comment': [
        'error',
        {
          beforeBlockComment: false,
          allowBlockStart: true,
          allowObjectStart: true,
          allowArrayStart: true,
        },
      ],
      '@stylistic/js/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: ['return', 'export', 'function'],
        },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
      ],
    },
  },
  {
    name: 'global rules',
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-unexpected-multiline': 'error',
      'no-var': 'error',
      'no-unsafe-optional-chaining': 'error',
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'as-needed'],
      'no-sparse-arrays': 'off',
    },
  },
  {
    name: 'prettier',
    rules: {
      'prettier/prettier': [
        'error',
        {
          printWidth: 120,
          singleQuote: true,
          endOfLine: 'auto',
        },
      ],
    },
  },
];
