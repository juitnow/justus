import { expectType, printType } from 'tsd'

import { validate } from '../src'
import { ean13 } from '../src/extra/ean13'
import { uuid } from '../src/extra/uuid'

import type { InferInput } from '../src'

printType('__file_marker__')

function inputType<T>(param: T): InferInput<T> {
  throw new Error(`${param}`)
}

expectType<string & { __brand_ean_13: never }>(validate(ean13, 'foo'))
expectType<string | number>(inputType(ean13))

expectType<string & { __brand_uuid: never }>(validate(uuid, 'foo'))
expectType<string>(inputType(uuid))
