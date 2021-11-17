import { ValidationError, object, validate, string, number, array, allowAdditionalProperties, any } from '../src'
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
    const contents = object({
      description: string({ minLength: 1 }),
      value: number,
    })

    const validator = object({
      version: 1,
      contents: array({ items: contents, minItems: 2 }),
    } as const)

    expect(validate(validator, {
      version: 1,
      contents: [ {
        description: 'foo',
        value: 123.456,
      }, {
        description: 'bar',
        value: 654.321,
      } ],
    })).to.eql({
      version: 1,
      contents: [ {
        description: 'foo',
        value: 123.456,
      }, {
        description: 'bar',
        value: 654.321,
      } ],
    })

    expect(() => validate(validator, { version: 2, contents: [] }))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'version' ], message: 'Value does not match constant "1"' },
          { path: [ 'contents' ], message: 'Array must have a minimum length of 2' },
        ])

    expect(() => validate(validator, { version: 3, contents: [ {}, 'foo' ] }))
        .to.throw(ValidationError, 'Found 4 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'version' ], message: 'Value does not match constant "1"' },
          { path: [ 'contents', 0, 'description' ], message: 'Required property missing' },
          { path: [ 'contents', 0, 'value' ], message: 'Required property missing' },
          { path: [ 'contents', 1 ], message: 'Value is not an "object"' },
        ])
  })

  it('should validate an object with additional properties', () => {
    const validator1 = object({ foo: true, ...allowAdditionalProperties })
    expect(validate(validator1, { foo: true, bar: 'whatever' }))
        .to.eql({ foo: true, bar: 'whatever' })

    const validator2 = object({ foo: true, ...allowAdditionalProperties(true) })
    expect(validate(validator2, { foo: true, bar: 'whatever' }))
        .to.eql({ foo: true, bar: 'whatever' })

    const validator3 = object({ foo: true, ...allowAdditionalProperties(any) })
    expect(validate(validator3, { foo: true, bar: 'whatever' }))
        .to.eql({ foo: true, bar: 'whatever' })

    const validator4 = object({ foo: true, ...allowAdditionalProperties(false) })
    expect(() => validate(validator4, { foo: true, bar: 'whatever' }))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [ 'bar' ], message: 'Unknown property' },
        ])

    const validator5 = object({ foo: true, ...allowAdditionalProperties(string) })
    expect(validate(validator5, { foo: true, bar: 'whatever' }))
        .to.eql({ foo: true, bar: 'whatever' })
    expect(() => validate(validator5, { foo: true, bar: 123 }))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [ 'bar' ], message: 'Value is not a "string"' },
        ])
  })
})
