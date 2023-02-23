import { expectAssignable, expectType, printType } from 'tsd'

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
expectType<(number|string)[]>(validate(tuple([ 1, ...string ]), null))
expectType<[ 1, ...number[] ]>(validate(tuple([ 1, ...number ] as const), null))

expectType<(number|string)[]>(validate(tuple([ 1, ...string ]), null))
expectType<[ 1, ...number[] ]>(validate(tuple([ 1, ...number ] as const), null))

// only rest arguments
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

// tuples in objects
const validator1 = object({
  tuple: [ number, string, ...boolean ],
} as const)
const result1 = validate(validator1, null)
expectAssignable<{ tuple: [ number, string, ...boolean[] ] }>(result1)
expectType<[ number, string, ...boolean[] ]>(result1.tuple)
expectType<number>(result1.tuple[0])
expectType<string>(result1.tuple[1])
expectType<boolean>(result1.tuple[2])
expectType<boolean>(result1.tuple[9])

const validator2 = object({
  tuple: [ 12345, 'foo', ...boolean ],
} as const)

const result2 = validate(validator2, null)
expectAssignable<{ tuple: [ 12345, 'foo', ...boolean[] ] }>(result2)
expectType<[ 12345, 'foo', ...boolean[] ]>(result2.tuple)
expectType<12345>(result2.tuple[0])
expectType<'foo'>(result2.tuple[1])
expectType<boolean>(result2.tuple[2])
expectType<boolean>(result2.tuple[9])

const validatorX = object({
  tuple: [ number, string, ...boolean ],
}) // no as const... types are messed up! :-)
const resultX = validate(validatorX, null)
expectAssignable<{ tuple:(number|string|boolean)[] }>(resultX)
expectType<(number|string|boolean)[]>(resultX.tuple)
expectType<number|string|boolean>(resultX.tuple[0])
expectType<number|string|boolean>(resultX.tuple[1])
expectType<number|string|boolean>(resultX.tuple[2])
expectType<number|string|boolean>(resultX.tuple[9])

// tuples in tuples
const tuple1 = tuple([ string, number ] as const)
const tuple2 = tuple([ 'header', ...tuple1 ] as const)
const result = validate(tuple2, null)

expectType<'header'>(result[0])

expectType<[ string, number ]>(result[1])
expectType<[ string, number ]>(result[9])

expectType<string>(result[1][0])
expectType<number>(result[1][1])

expectType<string>(result[9][0])
expectType<number>(result[9][1])

// objects in tuples
const testObject = object({ foo: string })

const tuple3 = tuple([ string, testObject ] as const)
const result3 = validate(tuple3, null)

expectAssignable<[ string, { foo: string }]>(result3)
expectType<string>(result3[0])

expectAssignable<{ foo: string }>(result3[1])
expectType<string>(result3[1].foo)

// objects in tuples as rest parameters
const tuple4 = tuple([ string, ...testObject ] as const)
const result4 = validate(tuple4, null)

expectAssignable<[ string, ...({ foo: string })[]]>(result4)
expectType<string>(result4[0])

expectAssignable<{ foo: string }>(result4[1])
expectType<string>(result4[1].foo)

expectAssignable<{ foo: string }>(result4[999])
expectType<string>(result4[999].foo)
