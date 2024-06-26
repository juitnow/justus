import { allowAdditionalProperties, any, array, boolean, never, number, object, objectOf, optional, partial, string, strip, validate, ValidationError } from '../src'

describe('Object validator', () => {
  it('should validate a generic object', () => {
    expect(validate(object, {})).toEqual({})
    expect(validate(object, { a: 1, b: 'foo' })).toEqual({ a: 1, b: 'foo' })

    expect(() => validate(object, 123))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [], message: 'Value is not an "object"' },
            ])))

    expect(() => validate(object, null))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [], message: 'Value is "null"' },
            ])))
  })

  it('should validate an object', () => {
    const validator = object({ a: number, b: string })

    expect(validate(validator, { a: 1, b: 'foo' })).toEqual({ a: 1, b: 'foo' })

    expect(() => validate(validator, 123))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [], message: 'Value is not an "object"' },
            ])))

    expect(() => validate(validator, null))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [], message: 'Value is "null"' },
            ])))

    expect(() => validate(validator, {}))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'a' ], message: 'Required property missing' },
              { path: [ 'b' ], message: 'Required property missing' },
            ])))

    expect(() => validate(validator, { a: 'foo', b: 1, c: true }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 3 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'a' ], message: 'Value is not a "number"' },
              { path: [ 'b' ], message: 'Value is not a "string"' },
              { path: [ 'c' ], message: 'Unknown property' },
            ])))
  })

  it('should validate a complex object', () => {
    const basic = object({
      version: 0,
      title: string,
    } as const)

    const contents = object({
      description: string({ minLength: 1 }),
      value: number,
    } as const)

    const validator = object({
      ...basic,
      version: 1,
      contents: array({ items: contents, minItems: 2 }),
    } as const)

    expect(validate(validator, {
      version: 1,
      title: 'hello, world!',
      contents: [ {
        description: 'foo',
        value: 123.456,
      }, {
        description: 'bar',
        value: 654.321,
      } ],
    })).toEqual({
      version: 1,
      title: 'hello, world!',
      contents: [ {
        description: 'foo',
        value: 123.456,
      }, {
        description: 'bar',
        value: 654.321,
      } ],
    })

    expect(() => validate(validator, { version: 2, contents: [] }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 3 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'version' ], message: 'Value does not match constant "1" (number)' },
              { path: [ 'title' ], message: 'Required property missing' },
              { path: [ 'contents' ], message: 'Array must have a minimum length of 2' },
            ])))

    expect(() => validate(validator, { version: 3, contents: [ {}, 'foo' ] }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 5 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'version' ], message: 'Value does not match constant "1" (number)' },
              { path: [ 'title' ], message: 'Required property missing' },
              { path: [ 'contents', 0, 'description' ], message: 'Required property missing' },
              { path: [ 'contents', 0, 'value' ], message: 'Required property missing' },
              { path: [ 'contents', 1 ], message: 'Value is not an "object"' },
            ])))
  })

  it('should validate an object tree', () => {
    const object1 = object({ zero: string })
    const object2 = object({ one: object1 })
    const object3 = object({ two: object2 })

    validate(object3, { two: { one: { zero: 'zero' } } })

    expect(() => validate(object3, { two: { one: { zero: 0 } } } ))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'two', 'one', 'zero' ], message: 'Value is not a "string"' },
            ])))
  })

  it('should validate an object with additional properties', () => {
    const validator1 = object({ foo: true, ...allowAdditionalProperties, baz: never })
    expect(validate(validator1, { foo: true, bar: 'whatever' }))
        .toEqual({ foo: true, bar: 'whatever' })
    expect(() => validate(validator1, { foo: false, bar: 'whatever', baz: true }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'foo' ], message: 'Value does not match constant "true" (boolean)' },
              { path: [ 'baz' ], message: 'Forbidden property' },
            ])))

    const validator2 = object({ foo: true, ...allowAdditionalProperties(true), baz: never })
    expect(validate(validator2, { foo: true, bar: 'whatever' }))
        .toEqual({ foo: true, bar: 'whatever' })
    expect(() => validate(validator2, { foo: false, bar: 'whatever', baz: true }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'foo' ], message: 'Value does not match constant "true" (boolean)' },
              { path: [ 'baz' ], message: 'Forbidden property' },
            ])))

    const validator3 = object({ foo: true, ...allowAdditionalProperties(any), baz: never })
    expect(validate(validator3, { foo: true, bar: 'whatever' }))
        .toEqual({ foo: true, bar: 'whatever' })
    expect(() => validate(validator3, { foo: false, bar: 'whatever', baz: true }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'foo' ], message: 'Value does not match constant "true" (boolean)' },
              { path: [ 'baz' ], message: 'Forbidden property' },
            ])))

    const validator4 = object({ foo: true, ...allowAdditionalProperties(false), baz: never })
    expect(() => validate(validator4, { foo: true, bar: 'whatever', baz: true }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'baz' ], message: 'Forbidden property' },
              { path: [ 'bar' ], message: 'Unknown property' },
            ])))

    const validator5 = object({ foo: true, ...allowAdditionalProperties(string), baz: never })
    expect(validate(validator5, { foo: true, bar: 'whatever' }))
        .toEqual({ foo: true, bar: 'whatever' })
    expect(validate(validator5, { foo: true, bar: undefined, baz: undefined }))
        .toEqual({ foo: true })
    expect(() => validate(validator5, { foo: true, bar: 123, baz: true }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'baz' ], message: 'Forbidden property' },
              { path: [ 'bar' ], message: 'Value is not a "string"' },
            ])))
  })

  it('should validate an object of specific values', () => {
    const validator1 = objectOf(string)
    expect(validate(validator1, { foo: 'FOO', bar: 'BAR' }))
        .toEqual({ foo: 'FOO', bar: 'BAR' })

    expect(() => validate(validator1, { foo: 'FOO', bar: true }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'bar' ], message: 'Value is not a "string"' },
            ])))

    const validator2 = objectOf({ test: boolean })
    expect(validate(validator2, { foo: { test: true }, bar: { test: false } }))
        .toEqual({ foo: { test: true }, bar: { test: false } })

    expect(() => validate(validator2, { foo: { test: 'hello' }, bar: { test: 123 } }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'foo', 'test' ], message: 'Value is not a "boolean"' },
              { path: [ 'bar', 'test' ], message: 'Value is not a "boolean"' },
            ])))
  })

  it('should strip additional or forbidden properties when asked to do so', () => {
    const validator = object({ foo: true, baz: never })

    // normal validation
    expect(validate(validator, { foo: true }))
        .toEqual({ foo: true })

    // validate with forbidden/unknown properties are "undefined"
    expect(validate(validator, { foo: true, bar: undefined, baz: undefined }))
        .toEqual({ foo: true })

    // validate with forbidden/unknown properties set
    expect(() => validate(validator, { foo: true, bar: 'whatever', baz: 123 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'baz' ], message: 'Forbidden property' },
              { path: [ 'bar' ], message: 'Unknown property' },
            ])))

    expect(() => strip(validator, { foo: true, bar: 'whatever', baz: 123 }, {
      stripAdditionalProperties: false,
    }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'baz' ], message: 'Forbidden property' },
              { path: [ 'bar' ], message: 'Unknown property' },
            ])))

    // strip with unknown properties set
    expect(validate(validator, { foo: true, bar: 'whatever' }, {
      stripAdditionalProperties: true,
    })).toEqual({ foo: true })

    expect(strip(validator, { foo: true, bar: 'whatever' }))
        .toEqual({ foo: true })

    // strip with forbidden properties set
    expect(validate(validator, { foo: true, baz: 'whatever' }, {
      stripForbiddenProperties: true,
    })).toEqual({ foo: true })

    expect(strip(validator, { foo: true, baz: 'whatever' }, {
      stripForbiddenProperties: true,
    })).toEqual({ foo: true })

    // strip with unknown/forbidden properties set
    expect(validate(validator, { foo: true, bar: 'whatever', baz: 'forbidden' }, {
      stripAdditionalProperties: true,
      stripForbiddenProperties: true,
    })).toEqual({ foo: true })

    // strip with forbidden properties set
    expect(() => validate(validator, { foo: true, bar: 'whatever', baz: 'forbidden' }, {
      stripAdditionalProperties: true,
    })).toThrow((assert) => assert
        .toBeError(ValidationError, /^Found 1 validation error/)
        .toHaveProperty('errors', expect.toMatchContents([
          { path: [ 'baz' ], message: 'Forbidden property' },
        ])))

    // strip with forbidden properties set
    expect(() => validate(validator, { foo: true, bar: 'whatever', baz: 'forbidden' }, {
      stripForbiddenProperties: true,
    })).toThrow((assert) => assert
        .toBeError(ValidationError, /^Found 1 validation error/)
        .toHaveProperty('errors', expect.toMatchContents([
          { path: [ 'bar' ], message: 'Unknown property' },
        ])))
  })

  it('should perform a partial validation', () => {
    const validation = object({
      required: string,
      optional: optional(boolean),
      defaults: optional(number, 123),
    })

    expect(partial(validation, {})).toEqual({})

    expect(partial(validation, { required: 'foo' })).toEqual({ required: 'foo' })
    expect(partial(validation, { optional: false })).toEqual({ optional: false })
    expect(partial(validation, { defaults: 12345 })).toEqual({ defaults: 12345 })

    expect(partial(validation, { required: null })).toEqual({})
    expect(partial(validation, { optional: null })).toEqual({})
    expect(partial(validation, { defaults: null })).toEqual({})

    expect(partial(validation, { addition: 'bar' })).toEqual({})
    expect(partial(validation, { addition: null })).toEqual({})

    expect(() => partial(validation, { required: 12345 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'required' ], message: 'Value is not a "string"' },
            ])))

    expect(() => partial(validation, { optional: 12345 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'optional' ], message: 'Value is not a "boolean"' },
            ])))

    expect(() => partial(validation, { defaults: 'foo' }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'defaults' ], message: 'Value is not a "number"' },
            ])))
  })

  it('should perform a partial validation with allowed additional propertiees', () => {
    const validation = object({
      required: string,
      optional: optional(boolean),
      defaults: optional(number, 123),
      ...allowAdditionalProperties(string),
    })

    expect(partial(validation, {})).toEqual({})

    expect(partial(validation, { required: 'foo' })).toEqual({ required: 'foo' })
    expect(partial(validation, { optional: false })).toEqual({ optional: false })
    expect(partial(validation, { defaults: 12345 })).toEqual({ defaults: 12345 })
    expect(partial(validation, { addition: 'bar' })).toEqual({ addition: 'bar' })

    expect(() => partial(validation, { required: 12345 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'required' ], message: 'Value is not a "string"' },
            ])))

    expect(() => partial(validation, { optional: 12345 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'optional' ], message: 'Value is not a "boolean"' },
            ])))

    expect(() => partial(validation, { defaults: 'foo' }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'defaults' ], message: 'Value is not a "number"' },
            ])))

    expect(() => partial(validation, { addition: 12345 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'addition' ], message: 'Value is not a "string"' },
            ])))
  })

  it('should extends and allow additional properties', () => {
    const object1 = object({ foo: string, ...allowAdditionalProperties(number) })
    const object2 = object({ ...object1, bar: boolean })

    expect(validate(object1, { foo: 'bar', bar: 321, baz: 123 }))
        .toEqual({ foo: 'bar', bar: 321, baz: 123 })
    expect(validate(object2, { foo: 'bar', bar: true, baz: 123 }))
        .toEqual({ foo: 'bar', bar: true, baz: 123 })

    expect(() => validate(object1, { foo: 'bar', bar: true, baz: 123 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'bar' ], message: 'Value is not a "number"' },
            ])))
  })

  it('should extends and remove additional properties', () => {
    const object1 = object({ foo: string, ...allowAdditionalProperties(number) })
    const object2 = object({ ...object1, ...allowAdditionalProperties(false) })

    expect(validate(object1, { foo: 'bar', bar: 123 })).toEqual({ foo: 'bar', bar: 123 })
    expect(() => validate(object2, { foo: 'bar', bar: 123 }))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'bar' ], message: 'Unknown property' },
            ])))
  })
})
