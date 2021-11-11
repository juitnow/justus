import { expectError, expectType, printType } from 'tsd'
import {
  object,
  validate,
  additionalProperties,
  number,
  string,
} from '../src/index'

printType(void '04-addprops')

// -------------------------------------------------------------------------- //

expectError(validate(object({
  // no ...additionalProperties
}), null).extra)

expectType<any>(validate(object({
  ...additionalProperties(), // default = true
}), null).extra)

expectType<any>(validate(object({
  ...additionalProperties(true),
}), null).extra)

expectError(validate(object({
  ...additionalProperties(false),
}), null).extra)

// -------------------------------------------------------------------------- //

expectType<null>(validate(object({ ...additionalProperties(null) }), null).extra)
expectType<Record<string, any>>(validate(object({ ...additionalProperties(object) }), null).extra)
expectType<number>(validate(object({ ...additionalProperties(number()) }), null).extra)
expectType<'hello'>(validate(object({ ...additionalProperties('hello') }), null).extra)

// -------------------------------------------------------------------------- //

const s1 = object({
  a: number,
  b: number,
})

const s2 = object({
  ...s1.schema,
  b: string,
  c: string,
})

const o = validate(s2, null)

expectType<number>(o.a)
expectType<string>(o.b)
expectType<string>(o.c)
