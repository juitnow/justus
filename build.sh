#!/bin/bash

export PATH="${PATH}:./node_modules/.bin"
export NODE_OPTIONS='--enable-source-maps'

set -xe

rm -rf build dist
mkdir -p build dist

# Check types and generate .d.ts files
tsc

# Prep sources and tests
esbuild \
  --format=cjs \
  --platform=node \
  --target=node16 \
  --sourcemap \
  --sources-content=false \
  --bundle \
  --outfile=build/src/index.js \
  src/index.ts

esbuild \
  --format=cjs \
  --platform=node \
  --target=node16 \
  --sourcemap \
  --sources-content=false \
  --outfile=build/src/dts-generator.js \
  src/dts-generator.ts

find "test" -type f -name "*.ts" -print0 | \
  xargs -0 esbuild \
    --format=cjs \
    --platform=node \
    --target=node16 \
    --sourcemap \
    --sources-content=false \
    --outdir=build/test

# Run tests and collect coverage
nyc --reporter=html --reporter=text mocha 'build/test/**/*.js'

# Lint our code
eslint src test test-d

# Extract and bundle our DTS
api-extractor run
cp build/types/dts-generator.d.ts ./dts-generator.d.ts


# Prepare distribution bundles for MJS and CJS
esbuild \
  --format=cjs \
  --platform=node \
  --target=node16 \
  --sourcemap \
  --sources-content=false \
  --bundle \
  --outfile=dist/index.js \
  src/index.ts

esbuild \
  --format=esm \
  --platform=node \
  --target=node16 \
  --sourcemap \
  --sources-content=false \
  --bundle \
  --outfile=dist/index.mjs \
  src/index.ts

# Our "dts-bundler" works only with "require" (for now)
esbuild \
  --format=cjs \
  --platform=node \
  --target=node16 \
  --sourcemap \
  --sources-content=false \
  --outfile=dist/dts-generator.js \
  src/dts-generator.ts
