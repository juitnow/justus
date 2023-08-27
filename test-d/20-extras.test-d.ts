import { expectType, printType } from 'tsd'

import { validate } from '../src'
import { arn, parseArn } from '../src/extra/arn'
import { ean13 } from '../src/extra/ean13'
import { uuid } from '../src/extra/uuid'

import type { InferInput } from '../src'
import type { ArnString, ParsedArn } from '../src/extra/arn'
import type { EAN13String } from '../src/extra/ean13'
import type { UUIDString } from '../src/extra/uuid'

printType('__file_marker__')

function inputType<T>(param: T): InferInput<T> {
  throw new Error(`${param}`)
}

/* ===== ARNs =============================================================== */

expectType<string & { __arn: never }>(validate(arn, 'foo'))
expectType<string & ArnString>(validate(arn, 'foo'))

expectType<(
& string
& { __arn: never }
& { __arn_service_myservice: never }
)>(validate(arn('myservice'), 'foo'))
expectType<ArnString<'myservice'>>(validate(arn('myservice'), 'foo'))

expectType<(
& string
& { __arn: never }
& { __arn_service_myservice: never }
& { __arn_resource_myresource: never }
)>(validate(arn('myservice', 'myresource'), 'foo'))
expectType<ArnString<'myservice', 'myresource'>>(validate(arn('myservice', 'myresource'), 'foo'))

expectType<ParsedArn<string>>(validate(parseArn, 'foo'))
expectType<ParsedArn<'myservice'>>(validate(parseArn('myservice'), 'foo'))
expectType<ParsedArn<'myservice', 'myresource'>>(validate(parseArn('myservice', 'myresource'), 'foo'))

expectType<string>(inputType(arn))
expectType<string>(inputType(parseArn))

/* ===== EAN-13s ============================================================ */

expectType<string & { __ean_13: never }>(validate(ean13, 'foo'))
expectType<EAN13String>(validate(ean13, 'foo'))
expectType<string | number>(inputType(ean13))

/* ===== UUIDs ============================================================== */

expectType<string & { __uuid: never }>(validate(uuid, 'foo'))
expectType<UUIDString>(validate(uuid, 'foo'))
expectType<string>(inputType(uuid))
