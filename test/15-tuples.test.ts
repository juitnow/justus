import { boolean, number, object, string, tuple, validate, ValidationError } from 'justus'
import { expect } from 'chai'

describe('Tuple validator', () => {
  it('should not validate non-arrays', () => {
    expect(() => validate([], 'string'))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [], message: 'Value is not an "array"',
        } ])
  })

  it('should validate an empty tuple', () => {
    const validator = tuple([])

    expect(validate(validator, [])).to.eql([])

    expect(() => validate(validator, [ 'foo' ]))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [], message: 'Found 1 element validating empty tuple',
        } ])

    expect(() => validate(validator, [ 'foo', 'bar' ]))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [], message: 'Found 2 elements validating empty tuple',
        } ])
  })

  it('should validate a simple tuple', () => {
    const validator = tuple([ string, number, boolean ])

    expect(validate(validator, [ 'foo', 123, true ]))
        .to.eql([ 'foo', 123, true ])

    expect(() => validate(validator, [ 123 ]))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [ 0 ], message: 'Value is not a "string"',
        } ])

    expect(() => validate(validator, [ 'foo', 123, true, 'bar' ]))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [], message: 'Found 1 extra element in tuple',
        } ])

    expect(() => validate(validator, [ 'foo', 123 ]))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [], message: 'Tuple defines 1 missing validation',
        } ])

    expect(() => validate(validator, [ 'foo' ]))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [], message: 'Tuple defines 2 missing validations',
        } ])
  })

  it('should validate a tuple with rest parameters', () => {
    const validator = tuple([ ...string, null, ...number ])

    expect(validate(validator, [ 'foo', 'bar', null, 123, 456 ]))
        .to.eql([ 'foo', 'bar', null, 123, 456 ])
    expect(validate(validator, [ 'foo', null, 123 ]))
        .to.eql([ 'foo', null, 123 ])

    expect(validate(validator, [ 'foo', 'bar', null ]))
        .to.eql([ 'foo', 'bar', null ])
    expect(validate(validator, [ 'foo', null ]))
        .to.eql([ 'foo', null ])

    expect(validate(validator, [ null, 123, 456 ]))
        .to.eql([ null, 123, 456 ])
    expect(validate(validator, [ null, 123 ]))
        .to.eql([ null, 123 ])

    expect(() => validate(validator, [ 'foo', 123 ]))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [ 1 ], message: 'Value does not match constant "null"',
        } ])

    expect(() => validate(validator, [ 'foo', null, 123, true ]))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [], message: 'Found 1 extra element in tuple',
        } ])
  })

  it('should validate a tuple with only rest parameters', () => {
    const v1 = tuple([ ...string, ...number ])
    expect(validate(v1, [ 'foo', 'bar', 123, 456 ]))
        .to.eql([ 'foo', 'bar', 123, 456 ])

    expect(validate(v1, [ 'foo', 'bar' ]))
        .to.eql([ 'foo', 'bar' ])

    expect(validate(v1, [ 123, 456 ]))
        .to.eql([ 123, 456 ])

    expect(validate(v1, []))
        .to.eql([])
  })

  it('should validate a tuple with an object rest parameter', () => {
    const o1 = object({ foo: string } as const)
    const v1 = tuple([ number, ...o1, boolean ])

    expect(validate(v1, [ 123, true ]))
        .to.eql([ 123, true ])

    expect(validate(v1, [ 123, { foo: 'bar' }, true ]))
        .to.eql([ 123, { foo: 'bar' }, true ])

    expect(validate(v1, [ 123, { foo: 'bar' }, { foo: 'baz' }, true ]))
        .to.eql([ 123, { foo: 'bar' }, { foo: 'baz' }, true ])
  })
})
