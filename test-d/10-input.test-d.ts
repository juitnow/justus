import { expectAssignable, expectType, printType } from 'tsd'

import {
  allOf,
  any,
  array,
  arrayOf,
  boolean,
  constant,
  date,
  never,
  number,
  object,
  oneOf,
  optional,
  string,
  url,
  validate,
} from '../src'

import type { InferInput } from '../src'

printType('__file_marker__')

function inputType<T>(param: T): InferInput<T> {
  throw new Error(`${param}`)
}

// constants

expectType<true>(inputType(true as const))
expectType<false>(inputType(false as const))
expectType<123>(inputType(123 as const))
expectType<'hello'>(inputType('hello' as const))

expectType<undefined>(inputType(undefined))
expectType<null>(inputType(null))

expectType<true>(inputType(constant(true)))
expectType<false>(inputType(constant(false)))
expectType<123>(inputType(constant(123)))
expectType<'hello'>(inputType(constant('hello')))

// validation _keywords_ (that is, no functions...)

expectType<any>(inputType(any))
expectType<boolean>(inputType(boolean))
expectType<Date | string | number>(inputType(date))
expectType<never>(inputType(never))
expectType<number>(inputType(number))
expectType<Record<string, any>>(inputType(object))
expectType<string>(inputType(string))
expectType<URL | string>(inputType(url))

// validation factories (keywords as functions)

expectType<boolean>(inputType(boolean({})))
expectType<Date | string | number>(inputType(date({})))
expectType<number>(inputType(number({})))
expectType<string>(inputType(string({})))
expectType<URL | string>(inputType(url({})))

// branded numbers/strings

expectType<number>(inputType(number({ brand: 'foobar' })))
expectType<string>(inputType(string({ brand: 'foobar' })))

expectType<number & { __brand_foobar: never }>(validate(number({ brand: 'foobar' }), 'x'))
expectType<string & { __brand_foobar: never }>(validate(string({ brand: 'foobar' }), 'x'))

// arrays

expectType<any[]>(inputType(array))
expectType<any[]>(inputType(array({})))
expectType<number[]>(inputType(array({ items: number })))
expectType<string[]>(inputType(arrayOf(string)))

// one of / all of

expectType<string | number>(inputType(oneOf(number, string)))
expectType<string | number | Date | URL>(inputType(oneOf(date, url)))

expectType<(string | number | Date) & URL>(inputType(allOf(date, url)))
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
