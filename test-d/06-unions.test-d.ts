import { expectAssignable, expectError, expectType, printType } from 'tsd'
import {
  number,
  string,
  oneOf,
  allOf,
  validate,
  boolean,
  Validator,
  object,
  InferValidationType,
} from '../src'

printType('__file_marker__')

const t1 = object({ o1: string })
const t2 = object({ o2: number })

/* -------------------------------------------------------------------------- */

const oneOf1 = oneOf([ string, number, boolean ])
expectAssignable<Validator<string | number | boolean>>(oneOf1)
expectType<string | number | boolean>(validate(oneOf1, null))

const oneOf2 = oneOf([ 'foo', 123, true ])
expectAssignable<Validator<string | number | true>>(oneOf2)
expectType<string | number | true>(validate(oneOf2, null))

const oneOf3 = oneOf([ 'foo', 123, true ] as const)
expectAssignable<Validator<'foo' | 123 | true>>(oneOf3)
expectType<'foo' | 123 | true>(validate(oneOf3, null))

const oneOf4 = oneOf([ t1, t2 ])
expectAssignable<Validator<InferValidationType<typeof t1 | typeof t2>>>(oneOf4)

const oneOfR4 = validate(oneOf4, null)
expectAssignable<{ o1: string } | { o2: number}>(oneOfR4)

if ('o1' in oneOfR4) {
  expectType<string>(oneOfR4.o1)
  expectError(oneOfR4.o2)
} else {
  expectType<number>(oneOfR4.o2)
  expectError(oneOfR4.o1)
}

/* -------------------------------------------------------------------------- */

const allOf1 = allOf([ string, number, boolean ])
expectAssignable<Validator<never>>(allOf1)
expectType<never>(validate(allOf1, null))

const allOf2 = allOf([ t1, t2 ])
expectAssignable<Validator<InferValidationType<typeof t1 & typeof t2>>>(allOf2)

const allOfR2 = validate(allOf2, null)
expectAssignable<{ o1: string, o2: number}>(allOfR2)

expectType<string>(allOfR2.o1)
expectType<number>(allOfR2.o2)
