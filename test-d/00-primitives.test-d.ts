import { expectType, printType } from 'tsd'

import {
  any,
  bigint,
  boolean,
  constant,
  number,
  string,
  validate,
} from '../src'

printType('__file_marker__')

// plain exports
expectType<any>(validate(any, null))
expectType<boolean>(validate(boolean, null))
expectType<number>(validate(number, null))
expectType<string>(validate(string, null))
expectType<bigint>(validate(bigint, null))

// constructed validators
expectType<number>(validate(number({}), null))
expectType<string>(validate(string({}), null))
expectType<bigint>(validate(bigint({}), null))

// constants
expectType<null>(validate(constant(null), null))
expectType<true>(validate(constant(true), null))
expectType<false>(validate(constant(false), null))
expectType<12345>(validate(constant(12345), null))
expectType<1234n>(validate(constant(1234n), null))
expectType<'xyz'>(validate(constant('xyz'), null))

// simple constants (no need for "as const")
expectType<null>(validate(null, null))
expectType<true>(validate(true, null))
expectType<false>(validate(false, null))
expectType<12345>(validate(12345, null))
expectType<1234n>(validate(1234n, null))
expectType<'xyz'>(validate('xyz', null))

// "branded" primitives
type BrandedBigInt = bigint & { __branded_bigint: never }
type BrandedNumber = number & { __branded_number: never }
type BrandedString = string & { __branded_string: never }

expectType<BrandedBigInt>(validate(bigint<BrandedBigInt>({}), null))
expectType<BrandedNumber>(validate(number<BrandedNumber>({}), null))
expectType<BrandedString>(validate(string<BrandedString>({}), null))

// implicit branding
expectType<bigint & { __brand_test: never }>(validate(bigint({ brand: 'test' }), null))
expectType<number & { __brand_test: never }>(validate(number({ brand: 'test' }), null))
expectType<string & { __brand_test: never }>(validate(string({ brand: 'test' }), null))
