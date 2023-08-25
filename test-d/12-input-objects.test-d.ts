import { expectError, printType } from 'tsd'

import {
  allOf,
  date,
  never,
  number,
  object,
  oneOf,
  optional,
  string,
  url,
} from '../src'

import type { InferInput, Validation } from '../src'

printType('__file_marker__')

function input<V extends Validation>(validation: V, input: InferInput<V>): void {
  void validation, input
}

// normal stuff

input(object({ foo: string }), { foo: 'bar' })

expectError(input(object({ foo: string }), {}))
expectError(input(object({ foo: string }), { foo: 12345 }))
expectError(input(object({ foo: string }), { bar: 'baz' }))

// properties mapping to different input types

input(object({ foo: date }), { foo: 'bar' })
input(object({ foo: date }), { foo: 12345 })
input(object({ foo: date }), { foo: new Date() })

expectError(input(object({ foo: date }), {}))
expectError(input(object({ foo: date }), { foo: false }))
expectError(input(object({ foo: date }), { bar: 'baz' }))

// never

input(object({ foo: never }), {})
input(object({ foo: never }), { foo: undefined })

expectError(input(object({ foo: never }), { foo: 'bar' }))
expectError(input(object({ foo: never }), { bar: 'baz' }))

// optionals without defaults

input(object({ foo: optional(string) }), {})
input(object({ foo: optional(string) }), { foo: undefined })
input(object({ foo: optional(string) }), { foo: 'foo' })

expectError(input(object({ foo: optional(string) }), { foo: false }))
expectError(input(object({ foo: optional(string) }), { foo: 12345 }))

input(object({ foo: optional(date) }), {})
input(object({ foo: optional(date) }), { foo: undefined })
input(object({ foo: optional(date) }), { foo: 'foo' })
input(object({ foo: optional(date) }), { foo: 12345 })

expectError(input(object({ foo: optional(date) }), { foo: false }))

// optionals _with_ defaults

input(object({ foo: optional(string, 'foo') }), {})
input(object({ foo: optional(string, 'foo') }), { foo: undefined })
input(object({ foo: optional(string, 'foo') }), { foo: 'foo' })

expectError(input(object({ foo: optional(string, 'foo') }), { foo: false }))
expectError(input(object({ foo: optional(string, 'foo') }), { foo: 12345 }))

input(object({ foo: optional(date, 'foo') }), {})
input(object({ foo: optional(date, 'foo') }), { foo: undefined })
input(object({ foo: optional(date, 'foo') }), { foo: 'foo' })
input(object({ foo: optional(date, 'foo') }), { foo: 12345 })

expectError(input(object({ foo: optional(date, 'foo') }), { foo: false }))

// union types

input(object({ foo: oneOf(string, number) }), { foo: 12345 })
input(object({ foo: oneOf(string, number) }), { foo: 'foo' })

expectError(input(object({ foo: oneOf(string, number) }), { foo: false }))

input(object({ foo: oneOf(date, url) }), { foo: 12345 })
input(object({ foo: oneOf(date, url) }), { foo: 'foo' })
input(object({ foo: oneOf(date, url) }), { foo: new Date() })
input(object({ foo: oneOf(date, url) }), { foo: new URL('foo') })

expectError(input(object({ foo: oneOf(date, url) }), { foo: false }))

input(object({ foo: allOf({ a: string }, { b: number }) }), { foo: { a: 'foo', b: 12345 } })

expectError(input(object({ foo: allOf({ a: string }, { b: number }) }), { foo: { a: 'foo' } }))
expectError(input(object({ foo: allOf({ a: string }, { b: number }) }), { foo: { b: 12345 } }))
expectError(input(object({ foo: allOf({ a: string }, { b: number }) }), { foo: { a: 12345, b: 'foo' } }))
