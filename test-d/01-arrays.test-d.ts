import { expectType, printType } from 'tsd'
import {
  any,
  array,
  boolean,
  constant,
  number,
  string,
  validate,
} from '../src/index'

type BrandedNumber = number & { __branded_number: never }
type BrandedString = string & { __branded_string: never }

printType(void '01-primitives')

// plain exports
expectType<any[]>(validate(array, null))

expectType<any[]>(validate(array(any), null))
expectType<boolean[]>(validate(array(boolean), null))
expectType<number[]>(validate(array(number), null))
expectType<string[]>(validate(array(string), null))

// constructed validators
expectType<number[]>(validate(array(number()), null))
expectType<string[]>(validate(array(string()), null))

// constants
expectType<null[]>(validate(array(constant(null)), null))
expectType<true[]>(validate(array(constant(true)), null))
expectType<false[]>(validate(array(constant(false)), null))
expectType<12345[]>(validate(array(constant(12345)), null))
expectType<'xyz'[]>(validate(array(constant('xyz')), null))

// simple constants (no need for "as const")
expectType<null[]>(validate(array(null), null))
expectType<true[]>(validate(array(true), null))
expectType<false[]>(validate(array(false), null))
expectType<12345[]>(validate(array(12345), null))
expectType<'xyz'[]>(validate(array('xyz'), null))

// "branded" primitives
expectType<BrandedNumber[]>(validate(array(number<BrandedNumber>()), null))
expectType<BrandedString[]>(validate(array(string<BrandedString>()), null))

// -------------------------------------------------------------------------- //

// with array constraints (items)

expectType<any[]>(validate(array({ items: any }), null))
expectType<boolean[]>(validate(array({ items: boolean }), null))
expectType<number[]>(validate(array({ items: number }), null))
expectType<string[]>(validate(array({ items: string }), null))

// constructed validators
expectType<number[]>(validate(array({ items: number() }), null))
expectType<string[]>(validate(array({ items: string() }), null))

// constants
expectType<null[]>(validate(array({ items: constant(null) }), null))
expectType<true[]>(validate(array({ items: constant(true) }), null))
expectType<false[]>(validate(array({ items: constant(false) }), null))
expectType<12345[]>(validate(array({ items: constant(12345) }), null))
expectType<'xyz'[]>(validate(array({ items: constant('xyz') }), null))

// simple constants (no need for "as const")
expectType<null[]>(validate(array({ items: null }), null))
expectType<true[]>(validate(array({ items: true }), null))
expectType<false[]>(validate(array({ items: false }), null))
expectType<12345[]>(validate(array({ items: 12345 }), null))
expectType<'xyz'[]>(validate(array({ items: 'xyz' }), null))

// "branded" primitives
expectType<BrandedNumber[]>(validate(array({ items: number<BrandedNumber>() }), null))
expectType<BrandedString[]>(validate(array({ items: string<BrandedString>() }), null))
