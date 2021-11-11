import { expectType, printType } from 'tsd'
import {
  any,
  boolean,
  constant,
  number,
  string,
  validate,
} from '../src/index'

printType(void '00-primitives')

// plain exports
expectType<any>(validate(any, null))
expectType<boolean>(validate(boolean, null))
expectType<number>(validate(number, null))
expectType<string>(validate(string, null))

// constructed validators
expectType<number>(validate(number(), null))
expectType<string>(validate(string(), null))

// constants
expectType<null>(validate(constant(null), null))
expectType<true>(validate(constant(true), null))
expectType<false>(validate(constant(false), null))
expectType<12345>(validate(constant(12345), null))
expectType<'xyz'>(validate(constant('xyz'), null))

// simple constants (no need for "as const")
expectType<null>(validate(null, null))
expectType<true>(validate(true, null))
expectType<false>(validate(false, null))
expectType<12345>(validate(12345, null))
expectType<'xyz'>(validate('xyz', null))

// "branded" primitives
type BrandedNumber = number & { __branded_number: never }
type BrandedString = string & { __branded_string: never }

expectType<BrandedNumber>(validate(number<BrandedNumber>(), null))
expectType<BrandedString>(validate(string<BrandedString>(), null))
