import { allOf, number, oneOf, string, validate, ValidationError } from '../src/index'
import { expect } from 'chai'

describe('Union validators', () => {
  it('should validate one of the given options', () => {
    const validator = oneOf(string, number)

    expect(validate(validator, 'foo')).to.equal('foo')
    expect(validate(validator, 12345)).to.equal(12345)
    expect(() => validate(validator, true))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { path: [], message: 'Value is not a "string"' },
          { path: [], message: 'Value is not a "number"' },
        ])
  })

  it('should validate all of the given options', () => {
    const s1 = string({ minLength: 3 })
    const s2 = string({ maxLength: 3 })

    const validator = allOf(s1, s2)

    expect(validate(validator, 'foo')).to.equal('foo')
    expect(() => validate(validator, ''))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [], message: 'String must have a minimum length of 3' },
        ])

    expect(() => validate(validator, 'foobar'))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([
          { path: [], message: 'String must have a maximum length of 3' },
        ])
  })
})
