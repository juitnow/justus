import { banner, build, find, merge, tasks } from '@plugjs/build'

export default build({
  ...tasks({
    exportsGlob: '(index|dts-generator).*',
  }),

  /** Lint all sources (including `test-d` stuff) */
  async lint(): Promise<void> {
    banner('Linting sources')

    await merge([
      this._find_lint_sources(),
      find('**/*.test-d.ts', { directory: 'test-d' }),
    ]).eslint()
  },
})
