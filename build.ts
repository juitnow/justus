import { banner, build, exec, find, hookAfter, log, merge, mkdtemp, resolve, rmrf, tasks } from '@plugjs/build'
import '@plugjs/tsd'

const localBuild = build({
  ...tasks({
    exportsGlob: '((index|dts-generator).*)|(extra/**.*)',
    extraLint: [ [ '**/*.test-d.ts', { directory: 'test-d' } ] ],
  }),

  /** Run `tsd` */
  async tsd(): Promise<void> {
    banner('Testing type definitions')
    await merge([
      find('**/*.test-d.ts', { directory: 'test-d' }),
      find('**/*.d.ts', { directory: 'types' }),
    ]).tsd()
  },

  /** Text compilation of *dependant* packages */
  async test_dependants(): Promise<void> {
    await this.transpile()

    banner('Testing transpilation of dependant packages')
    const tmpdir = mkdtemp()
    try {
      // copy files to the temporary directory
      await find('**/*', { directory: 'test/sources' })
          .copy(tmpdir)

      // instell ourselves as a module in the temporary directory
      await exec('npm', 'install', '--no-save', '--prefix', tmpdir, resolve('.'))

      // run tsc to make sure that all types are exported correctly
      await find('**/*.ts', { directory: tmpdir })
          .tsc('test/sources/tsconfig.json')

      log('Sources compiled successfully')
    } finally {
      await rmrf(tmpdir)
    }
  },
})

hookAfter(localBuild, 'test', [ 'tsd', 'test_dependants' ])

export default localBuild
