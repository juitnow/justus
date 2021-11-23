import { expectAssignable, expectError, expectType, printType } from 'tsd'
import { boolean, number, object, string, tuple, validate } from '../src'

printType('__file_marker__')

// with "as const"
expectType<[ 1 ]>(validate(tuple([ 1 ] as const), null))
expectType<[ 1, 'foo' ]>(validate(tuple([ 1, 'foo' ] as const), null))

// without "as const"
expectType<number[]>(validate(tuple([ 1 ]), null))
expectType<(number|string)[]>(validate(tuple([ 1, 'foo' ]), null))

// with validators
expectType<(number|string)[]>(validate(tuple([ 1, string ]), null))
expectType<[ 1, number ]>(validate(tuple([ 1, number ] as const), null))

// with rest arguments
expectType<(number|string)[]>(validate(tuple([ 1, ...string() ]), null))
expectType<[ 1, ...number[] ]>(validate(tuple([ 1, ...number() ] as const), null))

expectType<(number|string)[]>(validate(tuple([ 1, ...string ]), null))
expectType<[ 1, ...number[] ]>(validate(tuple([ 1, ...number ] as const), null))

// only rest arguments
expectType<string[]>(validate(tuple([ ...string() ]), null))
expectType<number[]>(validate(tuple([ ...number() ] as const), null))

expectType<string[]>(validate(tuple([ ...string ]), null))
expectType<number[]>(validate(tuple([ ...number ] as const), null))

// more tests
expectType<[ string, boolean, number, string ]>(validate(tuple([ string, boolean, number, string ] as const), null))
expectType<[ ...string[], boolean, number, string ]>(validate(tuple([ ...string, boolean, number, string ] as const), null))
expectType<[ string, ...boolean[], number, string ]>(validate(tuple([ string, ...boolean, number, string ] as const), null))
expectType<[ string, boolean, ...number[], string ]>(validate(tuple([ string, boolean, ...number, string ] as const), null))
expectType<[ string, boolean, number, ...string[] ]>(validate(tuple([ string, boolean, number, ...string ] as const), null))
expectType<[ string, ...(boolean|number)[], string ]>(validate(tuple([ string, ...boolean, ...number, string ] as const), null))
expectType<[ string, ...(boolean|string|number)[], string ]>(validate(tuple([ string, ...boolean, string, ...number, string ] as const), null))

expectType<[ 'foo', false, 12345, 'bar' ]>(validate(tuple([ 'foo', false, 12345, 'bar' ] as const), null))
expectType<[ ...string[], false, 12345, 'bar' ]>(validate(tuple([ ...string, false, 12345, 'bar' ] as const), null))
expectType<[ 'foo', ...boolean[], 12345, 'bar' ]>(validate(tuple([ 'foo', ...boolean, 12345, 'bar' ] as const), null))
expectType<[ 'foo', false, ...number[], 'bar' ]>(validate(tuple([ 'foo', false, ...number, 'bar' ] as const), null))
expectType<[ 'foo', false, 12345, ...string[] ]>(validate(tuple([ 'foo', false, 12345, ...string ] as const), null))
expectType<[ 'foo', ...(boolean|number)[], 'bar' ]>(validate(tuple([ 'foo', ...boolean, ...number, 'bar' ] as const), null))
expectType<[ 'foo', ...(boolean|'xxx'|number)[], 'bar' ]>(validate(tuple([ 'foo', ...boolean, 'xxx', ...number, 'bar' ] as const), null))

// TODO // tuples in objects
// const validator1 = object({
//   tuple: [ number, string, ...boolean ],
// })
// const result1 = validate(validator1, null)
// expectAssignable<{ tuple: [ number, string, ...boolean[] ] }>(result1)
// expectType<[ number, string, ...boolean[] ]>(result1.tuple)
// expectType<number>(result1.tuple[0])
// expectType<string>(result1.tuple[1])
// expectType<boolean>(result1.tuple[2])
// expectType<boolean>(result1.tuple[9])

// const validator2 = object({
//   tuple: [ 12345, 'foo', ...boolean ],
// } as const)

// const result2 = validate(validator2, null)
// expectAssignable<{ tuple: [ 12345, 'foo', ...boolean[] ] }>(result2)
// expectType<[ 12345, 'foo', ...boolean[] ]>(result2.tuple)
// expectType<12345>(result2.tuple[0])
// expectType<'foo'>(result2.tuple[1])
// expectType<boolean>(result2.tuple[2])
// expectType<boolean>(result2.tuple[9])

// // no rest arguments before last in object tuples
// expectError(object({
//   tuple: [ number, ...string, boolean ],
// }))

// expectError(object({
//   tuple: [ 123, ...string, boolean ],
// } as const))
