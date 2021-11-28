import { expect } from 'chai'
import { boolean, number, string, tuple, validate, ValidationError } from '../src'

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

    expect(validate(validator, [ 'foo', 123, true ])).to.eql([ 'foo', 123, true ])

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

    expect(() => validate([ ...number ], [ 'foo' ]))
        .to.throw(ValidationError, 'Found 1 validation error')
        .with.property('errors').to.eql([ {
          path: [], message: 'Found 1 extra element in tuple',
        } ])
  })
})
