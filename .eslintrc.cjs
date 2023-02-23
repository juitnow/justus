'use strict'

module.exports = {
  root: true,
  extends: [
    'plugin:@plugjs/typescript',
  ],
  parserOptions: {
    project: [
      './tsconfig.json',
      './test/tsconfig.json',
      './test-d/tsconfig.json',
    ],
  },
}
