import { arrayOf, number, object, optional, string, strip, validate, ValidationError } from '../src/index'
import { expect } from 'chai'

describe('Object modifiers', () => {
  it('should validate a simple optional validation', () => {
    const validation = optional('foobar')
    expect(validate(validation, undefined)).to.be.undefined
    expect(validate(validation, 'foobar')).to.equal('foobar')
    expect(() => validate(validation, 'wrong'))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').eql([
          { path: [], message: 'Value does not match constant "foobar"' },
        ])
  })

  it('should validate an array with optional elements', () => {
    const validation = arrayOf(optional('foobar'))
    expect(validate(validation, [ undefined ])).to.eql([ undefined ])
    expect(validate(validation, [ 'foobar' ])).to.eql([ 'foobar' ])
    expect(validate(validation, [ undefined, 'foobar' ])).to.eql([ undefined, 'foobar' ])

    expect(() => validate(validation, [ 'wrong', 12 ]))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').eql([
          { path: [ 0 ], message: 'Value does not match constant "foobar"' },
          { path: [ 1 ], message: 'Value does not match constant "foobar"' },
        ])
  })

  it('should validate an object with optional properties', () => {
    const schema1 = object({
      foo: string,
      bar: optional(number({ minimum: 50 })),
    })

    expect(validate(schema1, { foo: 'hello', bar: 50 }))
        .to.eql({ foo: 'hello', bar: 50 })

    expect(validate(schema1, { foo: 'hello' }))
        .to.eql({ foo: 'hello' })

    expect(() => validate(schema1, { foo: 'hello', bar: 40, baz: 60 }))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').eql([
          { path: [ 'bar' ], message: 'Number is less than 50' },
          { path: [ 'baz' ], message: 'Unknown property' },
        ])
  })

  it('should strip an object with optional properties', () => {
    const schema1 = object({
      foo: string,
      bar: optional(number({ minimum: 50 })),
    })

    expect(strip(schema1, { foo: 'hello', bar: 50, extra: 'foo' }))
        .to.eql({ foo: 'hello', bar: 50 })

    expect(strip(schema1, { foo: 'hello', bar: null, extra: 'foo' }))
        .to.eql({ foo: 'hello' })

    expect(strip(schema1, { foo: 'hello', extra: 'foo' }))
        .to.eql({ foo: 'hello' })

    expect(() => strip(schema1, { foo: 'hello', bar: 40, baz: 60, extra: 'foo' }))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').eql([
          { path: [ 'bar' ], message: 'Number is less than 50' },
        ])
  })
})
