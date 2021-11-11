'use strict'

module.exports = {
  root: true,
  env: {
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    project: './tsconfig.json',
    createDefaultProgram: true,
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'google',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
  ],
  rules: {
    // No logging / no debugging :-) Use our wrappers
    'no-console': 'warn',
    'no-debugger': 'warn',

    // Always have spaces around arrays and objects
    'array-bracket-spacing': [ 'error', 'always' ],
    'object-curly-spacing': [ 'error', 'always' ],

    // Always have newline character at the end of the file
    'eol-last': [ 'error', 'always' ],

    // Constraints for the max line length
    // 'max-len': [ 'error', { 'code': 120, 'comments': 80 } ],
    'max-len': [ 'off' ],

    // No more than 2 blank lines
    'no-multiple-empty-lines': [ 'error', { 'max': 2, 'maxBOF': 0, 'maxEOF': 1 } ],

    // Srings: either '...' or `... ${...} ...`, and no 'ab' + 'cd'
    'no-template-curly-in-string': [ 'error' ],
    'quotes': [ 'error', 'single', { 'allowTemplateLiterals': false } ],
    'no-useless-concat': [ 'error' ],

    // One variable per declaration, no "const x, y, ..."
    'one-var': [ 'error', 'never' ],

    // No semicolons
    'semi': [ 'error', 'never' ],

    // Allow TypeScript triple-slash comments
    'spaced-comment': [ 'error', 'always', { 'markers': [ '/ <reference' ] } ],

    // Remember our TODOs and FIXMEs
    'no-warning-comments': [ 'warn' ],

    // No "proper" JSDoc
    'require-jsdoc': [ 'off' ], // nope!
    'valid-jsdoc': [ 'off' ], // nope as well!

    // TypeScript sanity
    '@typescript-eslint/no-unused-vars': [ 'error' ],
    '@typescript-eslint/no-dupe-class-members': [ 'error' ],
    '@typescript-eslint/no-invalid-this': [ 'error' ],
    '@typescript-eslint/no-floating-promises': [ 'error' ],
    '@typescript-eslint/explicit-function-return-type': [ 'error', {
      'allowDirectConstAssertionInArrowFunctions': true,
      'allowConciseArrowFunctionExpressionsStartingWithVoid': true,
    } ],

    // Turn off specific JavaScript rules
    'no-undef': [ 'off' ], // it'll mark global types as undefs
    'no-redeclare': [ 'off' ], // use @typescript/no-redeclare
    'no-unused-vars': [ 'off' ], // use @typescript/no-unused-vars
    'no-dupe-class-members': [ 'off' ], // use @typescript/no-dupe-class-members
    'no-invalid-this': [ 'off' ], // use @typescript/no-invalid-this
  },
  overrides: [ {
    files: [ '*.js' ],
    env: {
      node: true,
    },
    rules: {
      'strict': [ 'error', 'global' ],

      // JavaScript sanity
      'no-undef': [ 'error' ],
      'no-redeclare': [ 'error' ],
      'no-unused-vars': [ 'error' ],
      'no-dupe-class-members': [ 'error' ],
      'no-invalid-this': [ 'error' ],

      // Turn off specific TypeScript rules
      '@typescript-eslint/no-unused-vars': [ 'off' ],
      '@typescript-eslint/no-dupe-class-members': [ 'off' ],
      '@typescript-eslint/no-invalid-this': [ 'off' ],
      '@typescript-eslint/no-floating-promises': [ 'off' ],
      '@typescript-eslint/explicit-function-return-type': [ 'off' ],
    },
  } ],
}
