'use strict'

const tsd = require('tsd')

tsd.default({
  cwd: process.cwd(),
  typingsFile: 'src/index.ts',
  testFiles: [
    'test-d/00-primitives.test-d.ts',
    'test-d/01-arrays.test-d.ts',
    'test-d/02-objects.test-d.ts',
    'test-d/03-modifiers.test-d.ts',
    'test-d/04-addprops.test-d.ts',
  ],
}).then((diags) => {
  console.log(`${diags.length} diagnostics`)
  console.log(diags)
})
