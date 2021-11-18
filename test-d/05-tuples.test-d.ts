import { expectError, expectType, printType } from 'tsd'
import { number, string, tuple, validate } from '../src'

printType('__file_marker__')

// with constants
expectType<[ 1 ]>(validate(tuple([ 1 ] as const), null))
expectType<[ 1, 'foo' ]>(validate(tuple([ 1, 'foo' ] as const), null))

// without constants
expectType<[ number ]>(validate(tuple([ 1 ]), null))
expectType<[ number, string ]>(validate(tuple([ 1, 'foo' ]), null))

// with validators
expectType<[ number, string ]>(validate(tuple([ 1, string ]), null))
expectType<[ 1, number ]>(validate(tuple([ 1, number ] as const), null))

// with rest arguments
expectType<[ number, ...string[] ]>(validate(tuple([ 1, ...string() ]), null))
expectType<[ 1, ...number[] ]>(validate(tuple([ 1, ...number() ] as const), null))

expectType<[ number, ...string[] ]>(validate(tuple([ 1, ...string ]), null))
expectType<[ 1, ...number[] ]>(validate(tuple([ 1, ...number ] as const), null))

// only rest arguments
expectType<string[]>(validate(tuple([ ...string() ]), null))
expectType<number[]>(validate(tuple([ ...number() ] as const), null))

expectType<string[]>(validate(tuple([ ...string ]), null))
expectType<number[]>(validate(tuple([ ...number ] as const), null))

// no rest arguments before last
expectError(tuple([ 1, ...string(), number ]))
expectError(tuple([ 1, ...number(), number ] as const))

expectError(tuple([ ...string(), number ]))
expectError(tuple([ ...number(), number ] as const))
