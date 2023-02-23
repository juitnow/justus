import { expectAssignable, expectError, expectType, printType } from 'tsd'

import {
  allowAdditionalProperties,
  boolean,
  never,
  number,
  object,
  string,
  validate,
} from '../src'

printType('__file_marker__')

// -------------------------------------------------------------------------- //

expectError(validate(object({
  // no ...additionalProperties
}), null).extra)

expectType<any>(validate(object({
  ...allowAdditionalProperties, // as a function
}), null).extra)

expectType<any>(validate(object({
  ...allowAdditionalProperties(), // default = true
}), null).extra)

expectType<any>(validate(object({
  ...allowAdditionalProperties(true),
}), null).extra)

expectError(validate(object({
  ...allowAdditionalProperties(false),
}), null).extra)

// -------------------------------------------------------------------------- //

expectType<null>(validate(object({ ...allowAdditionalProperties(null) }), null).extra)
expectType<Record<string, any>>(validate(object({ ...allowAdditionalProperties(object) }), null).extra)
expectType<number>(validate(object({ ...allowAdditionalProperties(number) }), null).extra)
expectType<'hello'>(validate(object({ ...allowAdditionalProperties('hello') }), null).extra)

// -------------------------------------------------------------------------- //
// combining schemas

const s0 = object({
  a: number,
  b: number,
  ...allowAdditionalProperties(boolean),
})

const s1 = object({
  ...s0,
  b: string,
  c: string,
})

const s2 = object({
  ...s1,
  ...allowAdditionalProperties(false),
})

const o1 = validate(s1, null)

expectType<number>(o1.a)
expectType<string>(o1.b)
expectType<string>(o1.c)
expectType<boolean>(o1.extra)

const o2 = validate(s2, null)

expectType<number>(o2.a)
expectType<string>(o2.b)
expectType<string>(o2.c)
expectError(o2.extra)

// -------------------------------------------------------------------------- //
// never

const s4 = object({
  a: number,
  b: never,
  c: string,
})

const o4 = validate(s4, null)

expectType<number>(o4.a)
expectType<never>(o4.b)
expectType<string>(o4.c)
expectAssignable<{ a: number, b?: undefined, c: string }>(o4)
expectError(o4.extra) // no additional properties

// never with "additionalProperties"

const s5 = object({
  a: number,
  b: never,
  c: string,
  ...allowAdditionalProperties(boolean),
})

const o5 = validate(s5, null)

expectType<number>(o5.a)
expectType<never>(o5.b) // forcedly removed from the resulting object
expectType<string>(o5.c)
expectAssignable<{ a: number, b?: undefined, c: string } & { [ k in string ]: boolean }>(o5)
expectType<boolean>(o5.extra) // defined in additionalProperties
