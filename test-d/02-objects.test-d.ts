import { expectAssignable, expectType, printType } from 'tsd'

import {
  any,
  array,
  arrayOf,
  boolean,
  constant,
  number,
  object,
  string,
  validate,
} from '../src'
import { objectOf } from '../src/validators/object'

printType('__file_marker__')

type BrandedNumber = number & { __branded_number: never }
type BrandedString = string & { __branded_string: never }

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
  x?: any,
  b: boolean,
  n: number,
  s: string,
  a: any[],
  o: Record<string, any>,
}>(o1)

// -------------------------------------------------------------------------- //
// constructed validators
const o2 = validate(object({
  n: number({}),
  s: string({}),
  a: arrayOf(boolean),
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
  o: { x: boolean },
}>(o2)

// -------------------------------------------------------------------------- //
// constructed validators
const o3 = validate(object({
  n: number({}),
  s: string({}),
  a: array({ items: string({}) }),
  o: object({ x: string({}) }),
}), null)

expectType<number>(o3.n)
expectType<string>(o3.s)
expectType<string[]>(o3.a)
expectType<string>(o3.o.x)

expectAssignable<{
  n: number,
  s: string,
  a: string[],
  o: { x: string },
}>(o3)

// -------------------------------------------------------------------------- //
// constants

const o4 = validate(object({
  z: constant(null),
  t: constant(true),
  f: constant(false),
  n: constant(12345),
  s: constant('xyz'),
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

// -------------------------------------------------------------------------- //
// simple constants (here we need "as const" on numbers and strings)

const o5 = validate(object({
  z: null,
  t: true,
  f: false,
  n: 12345 as const,
  s: 'xyz' as const,
}), null)

expectType<null>(o5.z)
expectType<true>(o5.t)
expectType<false>(o5.f)
expectType<12345>(o5.n)
expectType<'xyz'>(o5.s)

expectAssignable<{
  z: null,
  t: true,
  f: false,
  n: 12345,
  s: 'xyz',
}>(o5)

// -------------------------------------------------------------------------- //
// "branded" primitives

const o6 = validate(object({
  n: number<BrandedNumber>({}),
  s: string<BrandedString>({}),
}), null)

expectType<BrandedNumber>(o6.n)
expectType<BrandedString>(o6.s)

expectAssignable<{
  n: BrandedNumber,
  s: BrandedString,
}>(o6)

// -------------------------------------------------------------------------- //
// "objectOf" shortcutr

const o7 = validate(objectOf(number), null)
expectType<Record<string, number>>(o7)

const o8 = validate(objectOf([ 1, 2, 3 ] as const), null)
expectType<Record<string, [ 1, 2, 3 ]>>(o8)

const o9 = validate(objectOf({ test: boolean }), null)
expectAssignable<Record<string, { test: boolean }>>(o9)
