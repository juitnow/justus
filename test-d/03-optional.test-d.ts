import { expectAssignable, expectType, printType } from 'tsd'
import {
  any,
  array,
  boolean,
  constant,
  number,
  object,
  optional,
  string,
  validate,
} from '../src'

printType('__file_marker__')

type BrandedNumber = number & { __branded_number: never }
type BrandedString = string & { __branded_string: never }

// -------------------------------------------------------------------------- //
// combining modifiers

const o1 = validate(object({
  x: string,
  o: optional(string),
  oo: optional(optional(string)),
}), null)

expectType<string>(o1.x)
expectType<string | undefined>(o1.o)
expectType<string | undefined>(o1.oo)

expectAssignable<{
  readonly x: string,
  o?: string | undefined,
  oo?: string | undefined,
}>(o1)

// -------------------------------------------------------------------------- //
// plain exports

const o2 = validate(object({
  ox: optional(any),
  ob: optional(boolean),
  on: optional(number),
  os: optional(string),
  oa: optional(array),
  oo: optional(object),
}), null)

expectType<any | undefined>(o2.ox)
expectType<boolean | undefined>(o2.ob)
expectType<number | undefined>(o2.on)
expectType<string | undefined>(o2.os)
expectType<any[] | undefined>(o2.oa)
expectType<Record<string, any> | undefined>(o2.oo)

expectAssignable<{
  ox?: any | undefined,
  ob?: boolean | undefined,
  on?: number | undefined,
  os?: string | undefined,
  oa?: any[] | undefined,
  oo?: Record<string, any> | undefined,
}>(o2)

// -------------------------------------------------------------------------- //
// constructed validators

const o3 = validate(object({
  on: optional(number({})),
  os: optional(string({})),
  oa: optional(array({})),
}), null)

expectType<number | undefined>(o3.on)
expectType<string | undefined>(o3.os)
expectType<any[] | undefined>(o3.oa)

expectAssignable<{
  ox?: any | undefined,
  ob?: boolean | undefined,
  on?: number | undefined,
  os?: string | undefined,
  oa?: any[] | undefined,
}>(o3)

// -------------------------------------------------------------------------- //
// constants

const o4 = validate(object({
  oz: optional(constant(null)),
  ot: optional(constant(true)),
  of: optional(constant(false)),
  on: optional(constant(12345)),
  os: optional(constant('xyz')),
}), null)

expectType<null | undefined>(o4.oz)
expectType<true | undefined>(o4.ot)
expectType<false | undefined>(o4.of)
expectType<12345 | undefined>(o4.on)
expectType<'xyz' | undefined>(o4.os)

expectAssignable<{
  oz?: null | undefined,
  ot?: true | undefined,
  of?: false | undefined,
  on?: 12345 | undefined,
  os?: 'xyz' | undefined,
}>(o4)

// -------------------------------------------------------------------------- //
// simple constants (no need for "as const" on numbers and strings)

const o5 = validate(object({
  oz: optional(null),
  ot: optional(true),
  of: optional(false),
  on: optional(12345),
  os: optional('xyz'),
}), null)

expectType<null | undefined>(o5.oz)
expectType<true | undefined>(o5.ot)
expectType<false | undefined>(o5.of)
expectType<12345 | undefined>(o5.on)
expectType<'xyz' | undefined>(o5.os)

expectAssignable<{
  oz?: null | undefined,
  ot?: true | undefined,
  of?: false | undefined,
  on?: 12345 | undefined,
  os?: 'xyz' | undefined,
}>(o5)

// -------------------------------------------------------------------------- //
// "branded" primitives

const o6 = validate(object({
  on: optional(number<BrandedNumber>({})),
  os: optional(string<BrandedString>({})),
}), null)

expectType<BrandedNumber | undefined>(o6.on)
expectType<BrandedString | undefined>(o6.os)

expectAssignable<{
  on?: BrandedNumber | undefined,
  os?: BrandedString | undefined,
}>(o6)
