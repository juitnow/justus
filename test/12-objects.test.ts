import { ValidationError, object, validate, string, number, array, allowAdditionalProperties, any, never } from '../src/index'
import { expect } from 'chai'

describe('Object validator', () => {
  it('should validate a generic object', () => {
    expect(validate(object, {})).to.eql({})
    expect(validate(object, { a: 1, b: 'foo' })).to.eql({ a: 1, b: 'foo' })

    expect(validate(object(), {})).to.eql({})
    expect(validate(object(), { a: 1, b: 'foo' })).to.eql({ a: 1, b: 'foo' })

    expect(() => validate(object, 123))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [], message: 'Value is not an "object"' },
        ])

    expect(() => validate(object, null))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [], message: 'Value is "null"' },
        ])
  })

  it('should validate an object', () => {
    const validator = object({ a: number, b: string })

    expect(validate(validator, { a: 1, b: 'foo' })).to.eql({ a: 1, b: 'foo' })

    expect(() => validate(validator, 123))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [], message: 'Value is not an "object"' },
        ])

    expect(() => validate(validator, null))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [], message: 'Value is "null"' },
        ])

    expect(() => validate(validator, {}))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'a' ], message: 'Required property missing' },
          { path: [ 'b' ], message: 'Required property missing' },
        ])

    expect(() => validate(validator, { a: 'foo', b: 1, c: true }))
        .to.throw(ValidationError, 'Found 3 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'a' ], message: 'Value is not a "number"' },
          { path: [ 'b' ], message: 'Value is not a "string"' },
          { path: [ 'c' ], message: 'Unknown property' },
        ])
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
    })).to.eql({
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
        .to.throw(ValidationError, 'Found 3 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'version' ], message: 'Value does not match constant "1"' },
          { path: [ 'title' ], message: 'Required property missing' },
          { path: [ 'contents' ], message: 'Array must have a minimum length of 2' },
        ])

    expect(() => validate(validator, { version: 3, contents: [ {}, 'foo' ] }))
        .to.throw(ValidationError, 'Found 5 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'version' ], message: 'Value does not match constant "1"' },
          { path: [ 'title' ], message: 'Required property missing' },
          { path: [ 'contents', 0, 'description' ], message: 'Required property missing' },
          { path: [ 'contents', 0, 'value' ], message: 'Required property missing' },
          { path: [ 'contents', 1 ], message: 'Value is not an "object"' },
        ])
  })

  it('should validate an object with additional properties', () => {
    const validator1 = object({ foo: true, ...allowAdditionalProperties, baz: never })
    expect(validate(validator1, { foo: true, bar: 'whatever' }))
        .to.eql({ foo: true, bar: 'whatever' })
    expect(() => validate(validator1, { foo: false, bar: 'whatever', baz: true }))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'foo' ], message: 'Value does not match constant "true"' },
          { path: [ 'baz' ], message: 'Forbidden property' },
        ])

    const validator2 = object({ foo: true, ...allowAdditionalProperties(true), baz: never })
    expect(validate(validator2, { foo: true, bar: 'whatever' }))
        .to.eql({ foo: true, bar: 'whatever' })
    expect(() => validate(validator2, { foo: false, bar: 'whatever', baz: true }))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'foo' ], message: 'Value does not match constant "true"' },
          { path: [ 'baz' ], message: 'Forbidden property' },
        ])

    const validator3 = object({ foo: true, ...allowAdditionalProperties(any), baz: never })
    expect(validate(validator3, { foo: true, bar: 'whatever' }))
        .to.eql({ foo: true, bar: 'whatever' })
    expect(() => validate(validator3, { foo: false, bar: 'whatever', baz: true }))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'foo' ], message: 'Value does not match constant "true"' },
          { path: [ 'baz' ], message: 'Forbidden property' },
        ])

    const validator4 = object({ foo: true, ...allowAdditionalProperties(false), baz: never })
    expect(() => validate(validator4, { foo: true, bar: 'whatever', baz: true }))
        .to.throw(ValidationError, 'Found 2 validation error')
        .with.property('errors').to.eql([
          { path: [ 'baz' ], message: 'Forbidden property' },
          { path: [ 'bar' ], message: 'Unknown property' },
        ])

    const validator5 = object({ foo: true, ...allowAdditionalProperties(string), baz: never })
    expect(validate(validator5, { foo: true, bar: 'whatever' }))
        .to.eql({ foo: true, bar: 'whatever' })
    expect(validate(validator5, { foo: true, bar: undefined, baz: undefined }))
        .to.eql({ foo: true })
        .to.have.keys([ 'foo' ]) // remove undefined props
    expect(() => validate(validator5, { foo: true, bar: 123, baz: true }))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'baz' ], message: 'Forbidden property' },
          { path: [ 'bar' ], message: 'Value is not a "string"' },
        ])
  })

  it('should strip additional or forbidden properties when asked to do so', () => {
    const validator = object({ foo: true, baz: never })

    // normal validation
    expect(validate(validator, { foo: true }))
        .to.eql({ foo: true })

    // validate with forbidden/unknown properties are "undefined"
    expect(validate(validator, { foo: true, bar: undefined, baz: undefined }))
        .to.eql({ foo: true })
        .to.have.keys([ 'foo' ])

    // validate with forbidden/unknown properties set
    expect(() => validate(validator, { foo: true, bar: 'whatever', baz: 123 }))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'baz' ], message: 'Forbidden property' },
          { path: [ 'bar' ], message: 'Unknown property' },
        ])

    // strip with unknown properties set
    expect(validate(validator, { foo: true, bar: 'whatever' }, {
      stripAdditionalProperties: true,
    }))
        .to.eql({ foo: true })
        .to.have.keys([ 'foo' ])

    // strip with forbidden properties set
    expect(validate(validator, { foo: true, baz: 'whatever' }, {
      stripForbiddenProperties: true,
    }))
        .to.eql({ foo: true })
        .to.have.keys([ 'foo' ])

    // strip with unknown/forbidden properties set
    expect(validate(validator, { foo: true, bar: 'whatever', baz: 'forbidden' }, {
      stripAdditionalProperties: true,
      stripForbiddenProperties: true,
    }))
        .to.eql({ foo: true })
        .to.have.keys([ 'foo' ])

    // strip with forbidden properties set
    expect(() => validate(validator, { foo: true, bar: 'whatever', baz: 'forbidden' }, {
      stripAdditionalProperties: true,
    }))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [ 'baz' ], message: 'Forbidden property' },
        ])

    // strip with forbidden properties set
    expect(() => validate(validator, { foo: true, bar: 'whatever', baz: 'forbidden' }, {
      stripForbiddenProperties: true,
    }))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [ 'bar' ], message: 'Unknown property' },
        ])
  })

  it('should extends and remove additional properties', () => {
    const object1 = object({ foo: string, ...allowAdditionalProperties(number) })
    const object2 = object({ ...object1, ...allowAdditionalProperties(false) })

    expect(validate(object1, { foo: 'bar', bar: 123 })).to.eql({ foo: 'bar', bar: 123 })
    expect(() => validate(object2, { foo: 'bar', bar: 123 }))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [ 'bar' ], message: 'Unknown property' },
        ])
  })
})
