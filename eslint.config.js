import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import pluginJs from '@eslint/js';
import html from '@html-eslint/eslint-plugin';

export default [
  {
    name: 'ignores',
    ignores: [
      'dist/',
      '**/*.css',
    ],
  },
  {
    name: 'js: recommended',
    ...pluginJs.configs.recommended,
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
  stylistic.configs['all-flat'],
  {
    name: 'stylistic',
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/object-curly-spacing': [
        'error',
        'always',
      ],
      '@stylistic/padded-blocks': [
        'error',
        'never',
      ],
      '@stylistic/dot-location': [
        'error',
        'property',
      ],
      '@stylistic/quotes': [
        'error',
        'single',
      ],
      '@stylistic/quote-props': [
        'error',
        'as-needed',
      ],
      '@stylistic/indent': [
        'error',
        2,
      ],
      '@stylistic/semi': [
        'error',
        'always',
      ],
      '@stylistic/block-spacing': [
        'error',
        'always',
      ],
      '@stylistic/comma-dangle': [
        'error',
        'always-multiline',
      ],
      '@stylistic/no-mixed-operators': 'error',
      '@stylistic/lines-around-comment': [
        'error',
        {
          beforeBlockComment: false,
          allowBlockStart: true,
          allowObjectStart: true,
          allowArrayStart: true,
        },
      ],
      '@stylistic/padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: [
            'return',
            'export',
            'function',
          ],
        },
        {
          blankLine: 'always',
          prev: [
            'const',
            'let',
            'var',
          ],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: [
            'const',
            'let',
            'var',
          ],
          next: [
            'const',
            'let',
            'var',
          ],
        },
      ],
    },
  },
  {
    name: 'global rules',
    rules: {
      'no-console': [
        'error',
        {
          allow: [
            'warn',
            'error',
          ],
        },
      ],
      'no-unused-vars': 'off',
      'no-unexpected-multiline': 'error',
      'no-var': 'error',
      'no-unsafe-optional-chaining': 'error',
      curly: [
        'error',
        'all',
      ],
      'arrow-body-style': [
        'error',
        'as-needed',
      ],
      'no-sparse-arrays': 'off',
    },
  },
  {
    // recommended configuration included in the plugin
    ...html.configs['flat/recommended'],
    files: ['**/*.html'],
    rules: {
      ...html.configs['flat/recommended'].rules,
      '@html-eslint/indent': [
        'error',
        2,
      ],
      '@html-eslint/no-multiple-empty-lines': 'error',
      '@html-eslint/no-trailing-spaces': 'error',
    },
  },
];
