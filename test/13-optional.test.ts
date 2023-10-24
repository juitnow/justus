import { arrayOf, number, object, oneOf, optional, string, StringValidator, strip, validate, ValidationError } from '../src'

describe('Object modifiers', () => {
  it('should validate a simple optional validation', () => {
    const validation = optional('foobar')
    expect(validate(validation, undefined)).toBeUndefined()
    expect(validate(validation, 'foobar')).toStrictlyEqual('foobar')
    expect(() => validate(validation, 'wrong'))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [], message: 'Value does not match constant "foobar" (string)' },
            ])))
  })

  it('should validate an array with optional elements', () => {
    const validation = arrayOf(optional('foobar'))
    expect(validate(validation, [ undefined ])).toEqual([ undefined ])
    expect(validate(validation, [ 'foobar' ])).toEqual([ 'foobar' ])
    expect(validate(validation, [ undefined, 'foobar' ])).toEqual([ undefined, 'foobar' ])

    expect(() => validate(validation, [ 'wrong', 12 ]))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 0 ], message: 'Value does not match constant "foobar" (string)' },
              { path: [ 1 ], message: 'Value does not match constant "foobar" (string)' },
            ])))
  })

  it('should validate an object with optional properties', () => {
    const schema1 = object({
      foo: string,
      bar: optional(number({ minimum: 50 })),
    })

    expect(validate(schema1, { foo: 'hello', bar: 50 }))
        .toEqual({ foo: 'hello', bar: 50 })

    expect(validate(schema1, { foo: 'hello' }))
        .toEqual({ foo: 'hello' })

    expect(() => validate(schema1, { foo: 'hello', bar: 40, baz: 60 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'bar' ], message: 'Number is less than 50' },
              { path: [ 'baz' ], message: 'Unknown property' },
            ])))
  })

  it('should validate an object with optional properties and defaults', () => {
    const schema = object({
      foo: optional(oneOf('hello', 'world'), 'hello'),
      bar: optional(number({ minimum: 5 }), 10),
      baz: optional(string, 'world'),
    })

    expect(validate(schema, {}))
        .toEqual({ foo: 'hello', bar: 10, baz: 'world' })

    expect(validate(schema, { foo: 'world', bar: 15, baz: 'hello' }))
        .toEqual({ foo: 'world', bar: 15, baz: 'hello' })

    expect(() => validate(schema, { foo: 'nope', bar: 0, baz: 0 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 4 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'foo' ], message: 'Value does not match constant "hello" (string)' },
              { path: [ 'foo' ], message: 'Value does not match constant "world" (string)' },
              { path: [ 'bar' ], message: 'Number is less than 5' },
              { path: [ 'baz' ], message: 'Value is not a "string"' },
            ])))
  })

  it('should validate an object when a validator is forced as "optional"', () => {
    // here we "force" a non-optional validator to be optional: it will have
    // no default and throw, but since it is _optional_, if the value is
    // undefined the error will be ignored!
    const validator = new StringValidator()
    validator.optional = true

    expect(validate({ test: validator }, {})).toEqual({})
    expect(() => validate({ test: validator }, { test: 123 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'test' ], message: 'Value is not a "string"' },
            ])))
  })

  it('should fail when a default value does not match the validation', () => {
    expect(() => object({
      foo: optional(oneOf('hello', 'world'), 'nope' as any),
    })).toThrow((assert) => assert
        .toBeError(TypeError, 'Default value does not match validator')
        .toHaveProperty('cause', expect
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [], message: 'Value does not match constant "hello" (string)' },
              { path: [], message: 'Value does not match constant "world" (string)' },
            ]))))
  })

  it('should strip an object with optional properties', () => {
    const schema1 = object({
      foo: string,
      bar: optional(number({ minimum: 50 })),
    })

    expect(strip(schema1, { foo: 'hello', bar: 50, extra: 'foo' }))
        .toEqual({ foo: 'hello', bar: 50 })

    expect(strip(schema1, { foo: 'hello', bar: null, extra: 'foo' }))
        .toEqual({ foo: 'hello' })

    expect(strip(schema1, { foo: 'hello', extra: 'foo' }))
        .toEqual({ foo: 'hello' })

    expect(() => strip(schema1, { foo: 'hello', bar: 40, baz: 60, extra: 'foo' }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'bar' ], message: 'Number is less than 50' },
            ])))
  })
})
