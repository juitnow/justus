import { expectAssignable, expectError, expectType, printType } from 'tsd'
import {
  any,
  array,
  boolean,
  constant,
  number,
  object,
  optional,
  readonly,
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

  r: readonly(string),
  rr: readonly(readonly(string)),

  o: optional(string),
  oo: optional(optional(string)),

  ro: readonly(optional(string)),
  or: optional(readonly(string)),
}), null)

expectType<string>(o1.x)
expectType<string>(o1.r)
expectType<string>(o1.rr)
expectType<string | undefined>(o1.o)
expectType<string | undefined>(o1.oo)
expectType<string | undefined>(o1.ro)
expectType<string | undefined>(o1.or)

expectError(o1.r = 'x')
expectError(o1.rr = 'x')
expectError(o1.ro = 'x')
expectError(o1.or = 'x')

expectAssignable<{
  readonly x: string,
  readonly r: string,
  readonly rr: string,
  o?: string | undefined,
  oo?: string | undefined,
  readonly ro?: string | undefined,
  readonly or?: string | undefined,
}>(o1)

// -------------------------------------------------------------------------- //
// plain exports

const o2 = validate(object({
  rx: readonly(any),
  rb: readonly(boolean),
  rn: readonly(number),
  rs: readonly(string),
  ra: readonly(array),
  ro: readonly(object),

  ox: optional(any),
  ob: optional(boolean),
  on: optional(number),
  os: optional(string),
  oa: optional(array),
  oo: optional(object),
}), null)

expectType<any>(o2.rx)
expectType<boolean>(o2.rb)
expectType<number>(o2.rn)
expectType<string>(o2.rs)
expectType<any[]>(o2.ra)
expectType<Record<string, any>>(o2.ro)

expectType<any | undefined>(o2.ox)
expectType<boolean | undefined>(o2.ob)
expectType<number | undefined>(o2.on)
expectType<string | undefined>(o2.os)
expectType<any[] | undefined>(o2.oa)
expectType<Record<string, any> | undefined>(o2.oo)

expectAssignable<{
  readonly rx: any,
  readonly rb: boolean,
  readonly rn: number,
  readonly rs: string,
  readonly ra: any[],
  readonly ro: Record<string, any>,

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
  rn: readonly(number({})),
  rs: readonly(string({})),
  ra: readonly(array({})),

  on: optional(number({})),
  os: optional(string({})),
  oa: optional(array({})),
}), null)

expectType<number>(o3.rn)
expectType<string>(o3.rs)
expectType<any[]>(o3.ra)

expectType<number | undefined>(o3.on)
expectType<string | undefined>(o3.os)
expectType<any[] | undefined>(o3.oa)

expectAssignable<{
  readonly rn: number,
  readonly rs: string,
  readonly ra: any[],

  ox?: any | undefined,
  ob?: boolean | undefined,
  on?: number | undefined,
  os?: string | undefined,
  oa?: any[] | undefined,
}>(o3)

// -------------------------------------------------------------------------- //
// constants

const o4 = validate(object({
  rz: readonly(constant(null)),
  rt: readonly(constant(true)),
  rf: readonly(constant(false)),
  rn: readonly(constant(12345)),
  rs: readonly(constant('xyz')),

  oz: optional(constant(null)),
  ot: optional(constant(true)),
  of: optional(constant(false)),
  on: optional(constant(12345)),
  os: optional(constant('xyz')),
}), null)

expectType<null>(o4.rz)
expectType<true>(o4.rt)
expectType<false>(o4.rf)
expectType<12345>(o4.rn)
expectType<'xyz'>(o4.rs)

expectType<null | undefined>(o4.oz)
expectType<true | undefined>(o4.ot)
expectType<false | undefined>(o4.of)
expectType<12345 | undefined>(o4.on)
expectType<'xyz' | undefined>(o4.os)

expectAssignable<{
  readonly rz: null,
  readonly rt: true,
  readonly rf: false,
  readonly rn: 12345,
  readonly rs: 'xyz',

  oz?: null | undefined,
  ot?: true | undefined,
  of?: false | undefined,
  on?: 12345 | undefined,
  os?: 'xyz' | undefined,
}>(o4)

// -------------------------------------------------------------------------- //
// simple constants (no need for "as const" on numbers and strings)

const o5 = validate(object({
  rz: readonly(null),
  rt: readonly(true),
  rf: readonly(false),
  rn: readonly(12345),
  rs: readonly('xyz'),

  oz: optional(null),
  ot: optional(true),
  of: optional(false),
  on: optional(12345),
  os: optional('xyz'),
}), null)

expectType<null>(o5.rz)
expectType<true>(o5.rt)
expectType<false>(o5.rf)
expectType<12345>(o5.rn)
expectType<'xyz'>(o5.rs)

expectType<null | undefined>(o5.oz)
expectType<true | undefined>(o5.ot)
expectType<false | undefined>(o5.of)
expectType<12345 | undefined>(o5.on)
expectType<'xyz' | undefined>(o5.os)

expectAssignable<{
  readonly rz: null,
  readonly rt: true,
  readonly rf: false,
  readonly rn: 12345,
  readonly rs: 'xyz',

  oz?: null | undefined,
  ot?: true | undefined,
  of?: false | undefined,
  on?: 12345 | undefined,
  os?: 'xyz' | undefined,
}>(o5)

// -------------------------------------------------------------------------- //
// "branded" primitives

const o6 = validate(object({
  rn: readonly(number<BrandedNumber>({})),
  rs: readonly(string<BrandedString>({})),
  on: optional(number<BrandedNumber>({})),
  os: optional(string<BrandedString>({})),
}), null)

expectType<BrandedNumber>(o6.rn)
expectType<BrandedString>(o6.rs)

expectType<BrandedNumber | undefined>(o6.on)
expectType<BrandedString | undefined>(o6.os)

expectAssignable<{
  readonly rn: BrandedNumber,
  readonly rs: BrandedString,

  on?: BrandedNumber | undefined,
  os?: BrandedString | undefined,
}>(o6)
