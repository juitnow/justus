import { expectError, expectType, printType } from 'tsd'
import {
  allowAdditionalProperties,
  boolean,
  number,
  never,
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
expectType<number>(validate(object({ ...allowAdditionalProperties(number()) }), null).extra)
expectType<'hello'>(validate(object({ ...allowAdditionalProperties('hello') }), null).extra)

// -------------------------------------------------------------------------- //
// combining schemas

const s0 = object({
  a: number,
  b: number,
  ...allowAdditionalProperties(boolean),
})

const s1 = object({
  ...s0.schema,
  b: string,
  c: string,
})

const o1 = validate(s1, null)

expectType<number>(o1.a)
expectType<string>(o1.b)
expectType<string>(o1.c)
expectType<boolean>(o1.extra)

// -------------------------------------------------------------------------- //
// never

const s2 = object({
  a: number,
  b: never,
  c: string,
})

const o2 = validate(s2, null)

expectType<number>(o2.a)
expectError(o2.b) // does not exist on the returned object
expectType<string>(o2.c)
expectError(o2.extra) // no additional properties

// never with "additionalProperties"

const s3 = object({
  a: number,
  b: never,
  c: string,
  ...allowAdditionalProperties(boolean),
})

const o3 = validate(s3, null)

expectType<number>(o3.a)
expectType<never>(o3.b) // forcedly removed from the resulting object
expectType<string>(o3.c)
expectType<boolean>(o3.extra) // defined in additionalProperties
