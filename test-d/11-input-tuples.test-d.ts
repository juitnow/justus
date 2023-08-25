import { expectType, printType } from 'tsd'

import { date, tuple } from '../src'
import { url } from '../src/extra/url'

import type { InferInput } from '../src'

printType('__file_marker__')

function inputType<T>(param: T): InferInput<T> {
  throw new Error(`${param}`)
}

// as const

expectType<[ Date | string | number ]>(inputType(tuple([ date ] as const)))
expectType<[ Date | string | number ]>(inputType([ date ] as const))

expectType<[ Date | string | number, URL | string ]>(inputType(tuple([ date, url ] as const)))
expectType<[ Date | string | number, URL | string ]>(inputType([ date, url ] as const))

// as array (not really a tuple)

expectType<[ Date | string | number ]>(inputType(tuple([ date ])))
expectType<(Date | string | number)[]>(inputType([ date ])) // not much we can do about this...

expectType<[ Date | string | number, URL | string ]>(inputType(tuple([ date, url ])))
expectType<[ Date | string | number, URL | string ]>(inputType([ date, url ])) // recognized as a tuple

// with rest parameters at the end

expectType<[ string | number | Date, ...(string | URL)[] ]>(inputType(tuple([ date, ...url ] as const)))
expectType<[ string | number | Date, ...(string | URL)[] ]>(inputType([ date, ...url ] as const))

expectType<[ string | number | Date, ...(string | URL)[] ]>(inputType(tuple([ date, ...url ])))
expectType<[ string | number | Date, ...(string | URL)[] ]>(inputType([ date, ...url ]))

// with rest parameters at the beginning

expectType<[ ...(string | number | Date)[], (string | URL) ]>(inputType(tuple([ ...date, url ] as const)))
expectType<[ ...(string | number | Date)[], (string | URL) ]>(inputType([ ...date, url ] as const))

expectType<[ ...(string | number | Date)[], (string | URL) ]>(inputType(tuple([ ...date, url ])))
expectType<[ ...(string | number | Date)[], (string | URL) ]>(inputType([ ...date, url ]))
