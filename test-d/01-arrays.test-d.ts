import { expectType, printType } from 'tsd'
import {
  any,
  array,
  arrayOf,
  boolean,
  constant,
  number,
  string,
  validate,
} from '../src'

printType('__file_marker__')

type BrandedNumber = number & { __branded_number: never }
type BrandedString = string & { __branded_string: never }

// plain exports
expectType<any[]>(validate(array, null))

expectType<any[]>(validate(arrayOf(any), null))
expectType<boolean[]>(validate(arrayOf(boolean), null))
expectType<number[]>(validate(arrayOf(number), null))
expectType<string[]>(validate(arrayOf(string), null))

// constructed validators
expectType<number[]>(validate(arrayOf(number()), null))
expectType<string[]>(validate(arrayOf(string()), null))

// constants
expectType<null[]>(validate(arrayOf(constant(null)), null))
expectType<true[]>(validate(arrayOf(constant(true)), null))
expectType<false[]>(validate(arrayOf(constant(false)), null))
expectType<12345[]>(validate(arrayOf(constant(12345)), null))
expectType<'xyz'[]>(validate(arrayOf(constant('xyz')), null))

// simple constants (no need for "as const")
expectType<null[]>(validate(arrayOf(null), null))
expectType<true[]>(validate(arrayOf(true), null))
expectType<false[]>(validate(arrayOf(false), null))
expectType<12345[]>(validate(arrayOf(12345), null))
expectType<'xyz'[]>(validate(arrayOf('xyz'), null))

// "branded" primitives
expectType<BrandedNumber[]>(validate(arrayOf(number<BrandedNumber>()), null))
expectType<BrandedString[]>(validate(arrayOf(string<BrandedString>()), null))

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
