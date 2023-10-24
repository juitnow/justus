import { boolean, number, object, string, tuple, validate, ValidationError } from '../src'

describe('Tuple validator', () => {
  it('should not validate non-arrays', () => {
    expect(() => validate([], 'string'))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([ {
              path: [], message: 'Value is not an "array"',
            } ])))
  })

  it('should validate an empty tuple', () => {
    const validator = tuple([])

    expect(validate(validator, [])).toEqual([])

    expect(() => validate(validator, [ 'foo' ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([ {
              path: [], message: 'Found 1 element validating empty tuple',
            } ])))

    expect(() => validate(validator, [ 'foo', 'bar' ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([ {
              path: [], message: 'Found 2 elements validating empty tuple',
            } ])))
  })

  it('should validate a simple tuple', () => {
    const validator = tuple([ string, number, boolean ])

    expect(validate(validator, [ 'foo', 123, true ]))
        .toEqual([ 'foo', 123, true ])

    expect(() => validate(validator, [ 123 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([ {
              path: [ 0 ], message: 'Value is not a "string"',
            } ])))

    expect(() => validate(validator, [ 'foo', 123, true, 'bar' ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([ {
              path: [], message: 'Found 1 extra element in tuple',
            } ])))

    expect(() => validate(validator, [ 'foo', 123 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([ {
              path: [], message: 'Tuple defines 1 missing validation',
            } ])))

    expect(() => validate(validator, [ 'foo' ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([ {
              path: [], message: 'Tuple defines 2 missing validations',
            } ])))
  })

  it('should validate a tuple with rest parameters', () => {
    const validator = tuple([ ...string, null, ...number ])

    expect(validate(validator, [ 'foo', 'bar', null, 123, 456 ]))
        .toEqual([ 'foo', 'bar', null, 123, 456 ])
    expect(validate(validator, [ 'foo', null, 123 ]))
        .toEqual([ 'foo', null, 123 ])

    expect(validate(validator, [ 'foo', 'bar', null ]))
        .toEqual([ 'foo', 'bar', null ])
    expect(validate(validator, [ 'foo', null ]))
        .toEqual([ 'foo', null ])

    expect(validate(validator, [ null, 123, 456 ]))
        .toEqual([ null, 123, 456 ])
    expect(validate(validator, [ null, 123 ]))
        .toEqual([ null, 123 ])

    expect(() => validate(validator, [ 'foo', 123 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([ {
              path: [ 1 ], message: 'Value does not match constant "null"',
            } ])))

    expect(() => validate(validator, [ 'foo', null, 123, true ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([ {
              path: [], message: 'Found 1 extra element in tuple',
            } ])))
  })

  it('should validate a tuple with only rest parameters', () => {
    const v1 = tuple([ ...string, ...number ])
    expect(validate(v1, [ 'foo', 'bar', 123, 456 ]))
        .toEqual([ 'foo', 'bar', 123, 456 ])

    expect(validate(v1, [ 'foo', 'bar' ]))
        .toEqual([ 'foo', 'bar' ])

    expect(validate(v1, [ 123, 456 ]))
        .toEqual([ 123, 456 ])

    expect(validate(v1, []))
        .toEqual([])
  })

  it('should validate a tuple with an object rest parameter', () => {
    const o1 = object({ foo: string } as const)
    const v1 = tuple([ number, ...o1, boolean ])

    expect(validate(v1, [ 123, true ]))
        .toEqual([ 123, true ])

    expect(validate(v1, [ 123, { foo: 'bar' }, true ]))
        .toEqual([ 123, { foo: 'bar' }, true ])

    expect(validate(v1, [ 123, { foo: 'bar' }, { foo: 'baz' }, true ]))
        .toEqual([ 123, { foo: 'bar' }, { foo: 'baz' }, true ])
  })
})
