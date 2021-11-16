import { ValidationError, object, validate, string, number, array } from '../src'
import { expect } from 'chai'

describe('Array validators', () => {
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
          { path: [ 'c' ], message: 'Unknown property found' },
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
})
