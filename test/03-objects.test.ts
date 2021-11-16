import { ValidationError, object, validate, string, number } from '../src'
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
          { key: '', message: 'Value is not an "object"' },
        ])

    expect(() => validate(object, null))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { key: '', message: 'Value is "null"' },
        ])
  })

  it('should validate an object', () => {
    const validator = object({ a: number, b: string })

    expect(validate(validator, { a: 1, b: 'foo' })).to.eql({ a: 1, b: 'foo' })

    expect(() => validate(validator, 123))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { key: '', message: 'Value is not an "object"' },
        ])

    expect(() => validate(validator, null))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { key: '', message: 'Value is "null"' },
        ])

    expect(() => validate(validator, {}))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { key: 'a', message: 'Required property missing' },
          { key: 'b', message: 'Required property missing' },
        ])

    expect(() => validate(validator, { a: 'foo', b: 1 }))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { key: 'a', message: 'Value is not a "number"' },
          { key: 'b', message: 'Value is not a "string"' },
        ])
  })
})
