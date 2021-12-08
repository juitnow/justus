import * as esbuild from 'esbuild'
import * as path from 'path'
import * as fs from 'fs'

function build(options: esbuild.BuildOptions = {}): Promise<esbuild.BuildResult> {
  // extract "bundle"... we will always bundle local files, but that's
  // controlled by our plugin (if bundle true, then external false...)
  const { bundle = true, ...overrides } = options

  return esbuild.build({
    bundle: true, // always "bundle" (process imports)
    format: 'cjs', // by default target CommonJS
    platform: 'node', // yep, targeting node
    target: 'node16', // specifically node 16
    sourcemap: true, // generate external source maps
    sourcesContent: false, // no contents in source maps
    treeShaking: false, // NO
    plugins: [{
      name: 'justus-build',
      setup(build) {
        build.onResolve({ filter: /.*/ }, args => {
          // ignore the entry point
          if (! args.importer) return null

          // not starting with "."? external node module
          if (! args.path.startsWith('.')) {
            return { external: true }
          }

          // if we were asked to bundle... bundle!
          if (bundle) return { external: false }

          // not  bundling, always import as ".js" (CommonJS) or ".mjs" (ESM)
          const file = args.path.endsWith('.js') ? args.path.slice(0, -3) : args.path
          const ext = build.initialOptions.format === 'esm' ? 'mjs' : 'js'
          return { path: `${file}.${ext}`, external: true }
        })
      },
    }],
    ...overrides
  })
}

async function main() {
  console.log('Building sources for test')

  await build({
    outfile: 'build/src/index.js',
    entryPoints: [ './src/index.ts' ],
  })

  console.log('Building DTS/JSON Schema generator for test')

  await build({
    bundle: false,
    outfile: 'build/src/dts-generator.js',
    entryPoints: [ './src/dts-generator.ts' ],
  })

  await build({
    bundle: false,
    outfile: 'build/src/json-generator.js',
    entryPoints: [ './src/json-generator.ts' ],
  })

  const tests = (await fs.promises.readdir('test')).map((file) => {
    return file.endsWith('.test.ts') ? path.join('test', file) : ''
  }).filter((file) => !! file)

  console.log(`Building ${tests.length} tests`)

  await build({
    bundle: false,
    outdir: 'build/test',
    entryPoints: tests,
  })

  console.log('Building CommonJS sources')

  await build({
    outfile: 'dist/index.js',
    entryPoints: [ './src/index.ts' ],
  })

  console.log('Building CommonJS DTS/JSON schema generator')

  await build({
    bundle: false,
    outfile: 'dist/dts-generator.js',
    entryPoints: [ './src/dts-generator.ts' ],
  })

  await build({
    bundle: false,
    outfile: 'dist/json-generator.js',
    entryPoints: [ './src/json-generator.ts' ],
  })

  console.log('Building ESM sources')

  await build({
    format: 'esm',
    outfile: 'dist/index.mjs',
    entryPoints: [ './src/index.ts' ],
  })

  console.log('Building ESM DTS/JSON schema generator')

  await build({
    format: 'esm',
    bundle: false,
    outfile: 'dist/dts-generator.mjs',
    entryPoints: [ './src/dts-generator.ts' ],
  })

  await build({
    format: 'esm',
    bundle: false,
    outfile: 'dist/json-generator.mjs',
    entryPoints: [ './src/json-generator.ts' ],
  })
}

main().catch((error) => {
  process.exitCode = 1
  console.log(error)
})
