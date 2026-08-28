import '@plugjs/cov8'
import '@plugjs/expect5'
import { oxc } from '@plugjs/oxc'
import { banner, find, isDirectory, plugjs, rmrf } from '@plugjs/plug'
import '@plugjs/tsd'
import { tsc } from '@plugjs/tsgo'

export default plugjs({
  /** Flag indicating whether linting/formatting errors should be fixed or not */
  fix: 'false',

  /** Transpile all sources and produce some JavaScript code in 'dist' */
  async transpile(): Promise<void> {
    banner('Transpiling TypeScript Sources')
    if (isDirectory('dist')) await rmrf('dist')
    await tsc('src/tsconfig.json')
  },

  /** Run all tests */
  async test(): Promise<void> {
    banner('Running Tests')
    await rmrf('.coverage-data') // wipe existing coverage data
    // await tsc('test/tsconfig.json', { noEmit: true }) // type check our tests
    await find('**/*.test.*', { directory: 'test' }) // find all our test files
      .test({ coverageDir: '.coverage-data' }) // run tests
  },

  /** Run type definition tests */
  async tsd(): Promise<void> {
    await this.transpile()

    banner('Testing type definitions')
    await find('**/*.test-d.ts', { directory: 'test-d' }).tsd({
      cwd: 'test-d',
    })
  },

  /** Run tests capturing errors, but always producing coverage */
  async coverage(): Promise<void> {
    try {
      await this.test()
    } finally {
      banner('Preparing coverage report')
      await find('**/*.ts', { directory: 'src', ignore: 'configs/*.ts' }) //
        .coverage('.coverage-data', {
          reportDir: 'coverage',
          minimumCoverage: 100,
          minimumFileCoverage: 100,
        })
    }
  },

  /** Format and lint all our sources (optionally fixing them) */
  async lint(): Promise<void> {
    banner('Linting Sources')
    await oxc({ fix: this.fix === 'true' })
  },

  /** Generate our exports from the list of transpiled files */
  async exports(): Promise<void> {
    await this.transpile()

    banner('Generating Exports')
    await find('index.*', 'dts-generator.*', 'extra/**.*', { directory: 'dist' }).exports({})
  },

  /** Default task: transpile, test and lint */
  async default(): Promise<void> {
    await this.transpile()
    await this.tsd()
    await this.coverage()
    await this.lint()
  },
})
