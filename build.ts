import { banner, build, exec, find, hookAfter, log, merge, resolve, rmrf, tasks } from '@plugjs/build'
import '@plugjs/tsd'

const localBuild = build({
  ...tasks({
    exportsGlob: '(index|dts-generator).*',
  }),

  /** Run `tsd` */
  async tsd(): Promise<void> {
    banner('Testing type definitions')
    await merge([
      find('**/*.test-d.ts', { directory: 'test-d' }),
      find('**/*.d.ts', { directory: 'types' }),
    ]).tsd()
  },

  /** Lint all sources (including `test-d` stuff) */
  async lint_tsd(): Promise<void> {
    banner('Linting type defintion test sources')
    await find('**/*.test-d.ts', { directory: 'test-d' }).eslint()
  },

  /** Text compilation of *dependant* packages */
  async test_dependants(): Promise<void> {
    await this.transpile()

    banner('Testing transpilation of dependant packages')
    const tmpdir = '../blur' // mkdtemp()
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
hookAfter(localBuild, 'lint', [ 'lint_tsd' ])

export default localBuild
