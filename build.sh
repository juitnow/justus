#!/bin/bash

export PATH="${PATH}:./node_modules/.bin"
export NODE_OPTIONS='--enable-source-maps'

# set -xe

rm -rf build dist
mkdir -p build dist

# Check types and generate .d.ts files
tsc

# Prep sources and tests
find "src" "test" -type f -name "*.ts" -print0 | \
  xargs -0 esbuild \
    --format=cjs \
    --platform=node \
    --target=node16 \
    --sourcemap \
    --sources-content=false \
    --outdir=build

# Run tests and collect coverage
nyc --reporter=html --reporter=text mocha 'build/test/**/*.js'

# Lint our code
eslint src test test-d

# Extract and bundle our DTS
api-extractor run

# Prepare distribution bundles for MJS and CJS
esbuild \
  --format=cjs \
  --platform=node \
  --target=node16 \
  --sourcemap \
  --sources-content=false \
  --bundle \
  --outfile=dist/index.cjs \
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
