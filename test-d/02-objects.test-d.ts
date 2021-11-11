import { expectAssignable, expectError, expectType, printType } from 'tsd'
import {
  any,
  array,
  object,
  boolean,
  constant,
  number,
  string,
  validate,
} from '../src/index'

type BrandedNumber = number & { __branded_number: never }
type BrandedString = string & { __branded_string: never }

printType(void '02-objects')

// -------------------------------------------------------------------------- //
// plain exports
expectType<Record<string, any>>(validate(object, null))

const o1 = validate(object({
  x: any,
  b: boolean,
  n: number,
  s: string,
  a: array,
  o: object,
}), null)

expectType<any>(o1.x)
expectType<boolean>(o1.b)
expectType<number>(o1.n)
expectType<string>(o1.s)
expectType<any[]>(o1.a)
expectType<Record<string, any>>(o1.o)

expectAssignable<{
  x: any,
  b: boolean,
  n: number,
  s: string,
  a: any[],
  o: Record<string, any>,
}>(o1)

expectError(o1.extra)

// -------------------------------------------------------------------------- //
// constructed validators
const o2 = validate(object({
  n: number(),
  s: string(),
  a: array(boolean),
  o: object({ x: boolean }),
}), null)

expectType<number>(o2.n)
expectType<string>(o2.s)
expectType<boolean[]>(o2.a)
expectType<boolean>(o2.o.x)

expectAssignable<{
  n: number,
  s: string,
  a: boolean[],
  o: { x : boolean },
}>(o2)

expectError(o2.extra)

// -------------------------------------------------------------------------- //
// constants

const o3 = validate(object({
  z: constant(null),
  t: constant(true),
  f: constant(false),
  n: constant(12345),
  s: constant('xyz'),
}), null)

expectType<null>(o3.z)
expectType<true>(o3.t)
expectType<false>(o3.f)
expectType<12345>(o3.n)
expectType<'xyz'>(o3.s)

expectAssignable<{
  z: null,
  t: true,
  f: false,
  n: 12345,
  s: 'xyz',
}>(o3)

expectError(o3.extra)

// -------------------------------------------------------------------------- //
// simple constants (here need for "as const" on numbers and strings)

const o4 = validate(object({
  z: null,
  t: true,
  f: false,
  n: 12345 as const,
  s: 'xyz' as const,
}), null)

expectType<null>(o4.z)
expectType<true>(o4.t)
expectType<false>(o4.f)
expectType<12345>(o4.n)
expectType<'xyz'>(o4.s)

expectAssignable<{
  z: null,
  t: true,
  f: false,
  n: 12345,
  s: 'xyz',
}>(o4)

expectError(o4.extra)

// -------------------------------------------------------------------------- //
// "branded" primitives

const o5 = validate(object({
  n: number<BrandedNumber>(),
  s: string<BrandedString>(),
}), null)

expectType<BrandedNumber>(o5.n)
expectType<BrandedString>(o5.s)

expectAssignable<{
  n: BrandedNumber,
  s: BrandedString,
}>(o5)

expectError(o5.extra)
