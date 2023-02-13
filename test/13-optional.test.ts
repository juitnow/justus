import { arrayOf, number, object, oneOf, optional, string, StringValidator, strip, validate, ValidationError } from '../src/index'
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

  it('should validate an object with optional properties and defaults', () => {
    const schema = object({
      foo: optional(oneOf('hello', 'world'), 'hello'),
      bar: optional(number({ minimum: 5 }), 10),
      baz: optional(string, 'world'),
    })

    expect(validate(schema, {}))
        .to.eql({ foo: 'hello', bar: 10, baz: 'world' })

    expect(validate(schema, { foo: 'world', bar: 15, baz: 'hello' }))
        .to.eql({ foo: 'world', bar: 15, baz: 'hello' })

    expect(() => validate(schema, { foo: 'nope', bar: 0, baz: 0 }))
        .to.throw(ValidationError, 'Found 4 validation errors')
        .with.property('errors').eql([
          { path: [ 'foo' ], message: 'Value does not match constant "hello"' },
          { path: [ 'foo' ], message: 'Value does not match constant "world"' },
          { path: [ 'bar' ], message: 'Number is less than 5' },
          { path: [ 'baz' ], message: 'Value is not a "string"' },
        ])
  })

  it('should validate an object when a validator is forced as "optional"', () => {
    // here we "force" a non-optional validator to be optional: it will have
    // no default and throw, but since it is _optional_, if the value is
    // undefined the error will be ignored!
    const validator = new StringValidator()
    validator.optional = true

    expect(validate({ test: validator }, { })).to.eql({})
    expect(() => validate({ test: validator }, { test: 123 }))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').eql([
          { path: [ 'test' ], message: 'Value is not a "string"' },
        ])
  })

  it('should fail when a default value does not match the validation', () => {
    expect(() => object({
      foo: optional(oneOf('hello', 'world'), 'nope' as any),
    })).to.throw(TypeError, 'Default value does not match validator')
        .and.have.property('cause')
        .instanceOf(ValidationError)
        .with.property('errors').eql([
          { path: [], message: 'Value does not match constant "hello"' },
          { path: [], message: 'Value does not match constant "world"' },
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
