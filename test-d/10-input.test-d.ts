import { expectAssignable, expectType, printType } from 'tsd'

import {
  allOf,
  any,
  array,
  arrayOf,
  bigint,
  boolean,
  constant,
  date,
  never,
  number,
  object,
  oneOf,
  optional,
  string,
  validate,
} from '../src'
import { url } from '../src/extra/url'

import type { InferInput } from '../src'

printType('__file_marker__')

function inputType<T>(param: T): InferInput<T> {
  throw new Error(`${param}`)
}

// constants

expectType<true>(inputType(true as const))
expectType<false>(inputType(false as const))
expectType<12345>(inputType(12345 as const))
expectType<1234n>(inputType(1234n as const))
expectType<'foo'>(inputType('foo' as const))

expectType<undefined>(inputType(undefined))
expectType<null>(inputType(null))

expectType<true>(inputType(constant(true)))
expectType<false>(inputType(constant(false)))
expectType<12345>(inputType(constant(12345)))
expectType<1234n>(inputType(constant(1234n)))
expectType<'foo'>(inputType(constant('foo')))

// validation _keywords_ (that is, no functions...)

expectType<any>(inputType(any))
expectType<bigint>(inputType(bigint))
expectType<boolean>(inputType(boolean))
expectType<Date | string | number>(inputType(date))
expectType<never>(inputType(never))
expectType<number>(inputType(number))
expectType<Record<string, any>>(inputType(object))
expectType<string>(inputType(string))
expectType<URL | string>(inputType(url))

// validation factories (keywords as functions)

expectType<bigint>(inputType(bigint({})))
expectType<boolean>(inputType(boolean({})))
expectType<Date | string | number>(inputType(date({})))
expectType<number>(inputType(number({})))
expectType<string>(inputType(string({})))
expectType<URL | string>(inputType(url({})))

// branded numbers/strings

expectType<bigint>(inputType(bigint({ brand: 'foobar' })))
expectType<number>(inputType(number({ brand: 'foobar' })))
expectType<string>(inputType(string({ brand: 'foobar' })))

expectType<bigint & { __brand_foobar: never }>(validate(bigint({ brand: 'foobar' }), 'x'))
expectType<number & { __brand_foobar: never }>(validate(number({ brand: 'foobar' }), 'x'))
expectType<string & { __brand_foobar: never }>(validate(string({ brand: 'foobar' }), 'x'))

// arrays

expectType<any[]>(inputType(array))
expectType<any[]>(inputType(array({})))
expectType<number[]>(inputType(array({ items: number })))
expectType<string[]>(inputType(arrayOf(string)))
expectType<(string | URL)[]>(inputType(arrayOf(url)))

// one of / all of

expectType<string | number>(inputType(oneOf(number, string)))
expectType<string | number | Date | URL>(inputType(oneOf(date, url)))
expectType<string | number | Date | URL>(inputType(oneOf(url, date))) // reversed

expectType<(string | number | Date) & (string | URL)>(inputType(allOf(date, url)))
expectType<(string | URL) & (string | number | Date)>(inputType(allOf(url, date))) // reversed
expectAssignable<{ a: number } & { b: string }>(inputType(allOf({ a: number }, { b: string })))

// optional

expectType<string | undefined>(inputType(optional(string)))
expectType<string | undefined>(inputType(optional(string, 'foo' as const)))
expectType<string | undefined>(inputType(optional(string, 12345 as const)))

expectType<number[] | undefined>(inputType(optional(arrayOf(number))))
expectType<number[] | undefined>(inputType(optional(arrayOf(number), [ 1, 2, 3 ] as const)))
expectType<number[] | undefined>(inputType(optional(arrayOf(number), 12345 as const)))

expectType<Date | string | number | undefined>(inputType(optional(date)))
expectType<Date | string | number | undefined>(inputType(optional(date, 'foo' as const)))
expectType<Date | string | number | undefined>(inputType(optional(date, 12345 as const)))

// optional + array + oneof

expectType<(string | number | Date | URL)[] | undefined>(inputType(optional(arrayOf(oneOf(url, date)))))
expectType<(string | number | Date | URL)[] | undefined>(inputType(optional(arrayOf(oneOf(date, url)))))
