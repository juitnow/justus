import { array, arrayOf, ArrayValidator, string, validate, ValidationError } from '../src'

describe('Array validator', () => {
  it('should validate an array', () => {
    expect(validate(array, [ 1, true, 'foo' ])).toEqual([ 1, true, 'foo' ])
    expect(validate(array, [])).toEqual([])

    expect(() => validate(array, 123))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [], message: 'Value is not an "array"' },
            ])))
  })

  it('should validate an array of a specified length', () => {
    const length = array({ minItems: 3, maxItems: 6 })
    expect(validate(length, [ 1, 2, 3 ])).toEqual([ 1, 2, 3 ])
    expect(validate(length, [ 1, 2, 3, 4, 5, 6 ])).toEqual([ 1, 2, 3, 4, 5, 6 ])
    expect(() => validate(length, [ 1, 2 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [], message: 'Array must have a minimum length of 3' },
            ])))
    expect(() => validate(length, [ 1, 2, 3, 4, 5, 6, 7 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [], message: 'Array must have a maximum length of 6' },
            ])))

    expect(validate(array({ minItems: 3, maxItems: 3 }), [ 1, 2, 3 ])).toEqual([ 1, 2, 3 ])

    expect(() => array({ minItems: -1 }))
        .toThrowError(TypeError, 'Constraint "minItems" (-1) must be non-negative')
    expect(() => array({ maxItems: -1 }))
        .toThrowError(TypeError, 'Constraint "maxItems" (-1) must be non-negative')
    expect(() => array({ minItems: 4, maxItems: 3 }))
        .toThrowError(TypeError, 'Constraint "minItems" (4) is greater than "maxItems" (3)')
  })

  it('should validate an array with unique items', () => {
    expect(validate(array, [ 1, 2, 1 ])).toEqual([ 1, 2, 1 ])
    expect(validate(array({ uniqueItems: false }), [ 1, 2, 1 ])).toEqual([ 1, 2, 1 ])

    expect(() => validate(array({ uniqueItems: true }), [ 1, 2, 1, 2 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 2 ], message: 'Duplicate of item at index 0' },
              { path: [ 3 ], message: 'Duplicate of item at index 1' },
            ])))
  })

  it('should validate an array with items of a specific type', () => {
    expect(validate(arrayOf(string), [ 'a', 'b', 'c' ])).toEqual([ 'a', 'b', 'c' ])

    expect(() => validate(arrayOf(string), [ 'a', true, 'b', 123 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 1 ], message: 'Value is not a "string"' },
              { path: [ 3 ], message: 'Value is not a "string"' },
            ])))

    expect(validate(arrayOf(string), [ 'a', 'b', 'c' ])).toEqual([ 'a', 'b', 'c' ])

    expect(() => validate(arrayOf(string), [ 'a', true, 'b', 123 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 1 ], message: 'Value is not a "string"' },
              { path: [ 3 ], message: 'Value is not a "string"' },
            ])))

    expect(validate(arrayOf('a'), [ 'a', 'a', 'a' ])).toEqual([ 'a', 'a', 'a' ])

    expect(() => validate(arrayOf('a'), [ 'a', true, 'b', 123 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 3 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 1 ], message: 'Value does not match constant "a" (string)' },
              { path: [ 2 ], message: 'Value does not match constant "a" (string)' },
              { path: [ 3 ], message: 'Value does not match constant "a" (string)' },
            ])))

    expect(validate(arrayOf('a'), [ 'a', 'a', 'a' ])).toEqual([ 'a', 'a', 'a' ])

    expect(() => validate(array({ items: 'a', uniqueItems: true }), [ 'a', true, 'a', 123 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 3 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 1 ], message: 'Value does not match constant "a" (string)' },
              { path: [ 2 ], message: 'Duplicate of item at index 0' },
              { path: [ 3 ], message: 'Value does not match constant "a" (string)' },
            ])))
  })

  it('should validate an array using the ArrayValidator class', () => {
    const validator = new ArrayValidator()
    expect(validate(validator, [ 1, 'foo', true ])).toEqual([ 1, 'foo', true ])
  })
})
