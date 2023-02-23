/* eslint-disable no-console */

import { readdirSync } from 'node:fs'
import { relative } from 'node:path'

import { log } from '@plugjs/build'
import tsd from 'tsd'

describe('Types test', () => {
  const testFiles = readdirSync('test-d', { withFileTypes: true })
      .filter((dirent) => dirent.isFile())
      .map(({ name }) => `test-d/${name}`)
      .filter((name) => /\.test-d\.ts$/.test(name))

  it(`should run ${testFiles.length} types test`, async function() {
    const diagnostics = await tsd({
      cwd: process.cwd(),
      typingsFile: 'src/index.ts',
      testFiles,
    })

    diagnostics.sort((d1, d2): number => {
      const num =
        d1.fileName < d2.fileName ? -1 :
        d1.fileName > d2.fileName ? +1 :
        (d1.line || 0) < (d2.line || 0) ? -1 :
        (d1.line || 0) > (d2.line || 0) ? +1 :
        (d1.column || 0) < (d2.column || 0) ? -1 :
        (d1.column || 0) > (d2.column || 0) ? +1 :
        d1.message < d2.message ? -1 :
        d1.message > d2.message ? +1 :
        0
      return num
    })

    let errors = 0
    diagnostics
        // normalize file names
        .filter((diag) => diag.fileName = relative(process.cwd(), diag.fileName))
        // emit our "__file_marker__" logs (niceties)
        .filter((diag) => {
          if (/__file_marker__/.test(diag.message) && (diag.severity === 'warning')) {
            log.notice(`\u001b[34m\u2731\u001b[90m ${diag.fileName}\u001b[0m`)
            return false
          } else {
            return true
          }
        })
        // write out warnings and filter them
        .filter((diag) => {
          if (diag.severity != 'warning') return true
          log.warn(`\u001b[33m\u2731\u001b[0m ${diag.message}`)
          log.warn(`  \u001b[90m  in ./${diag.fileName}:${diag.line}\u001b[0m`)
          return false
        })
        // write out errors and count them
        .filter((diag) => {
          log.error(`\u001b[31m\u2716\u001b[0m ${diag.message}`)
          log.error(`  \u001b[90m  in ./${diag.fileName}:${diag.line}\u001b[0m`)
          errors ++
        })

    // throw if we saw any errors...
    if (errors > 0) throw new Error(`Found ${errors} type errors`)
  })
})
