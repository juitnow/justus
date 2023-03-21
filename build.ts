import { banner, build, find, hookAfter, tasks } from '@plugjs/build'
import '@plugjs/tsd'

const localBuild = build({
  ...tasks({
    exportsGlob: '(index|dts-generator).*',
  }),

  /** Run `tsd` */
  async tsd(): Promise<void> {
    banner('Testing type definitions')
    await find('**/*.test-d.ts', { directory: 'test-d' }).tsd()
  },

  /** Lint all sources (including `test-d` stuff) */
  async lint_tsd(): Promise<void> {
    banner('Linting type defintion test sources')

    await find('**/*.test-d.ts', { directory: 'test-d' }).eslint()
  },
})

hookAfter(localBuild, 'test', [ 'tsd' ])
hookAfter(localBuild, 'lint', [ 'lint_tsd' ])

export default localBuild
