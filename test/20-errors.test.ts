import { expect } from 'chai'
import { ValidationError } from '../src'

describe('Validation errors', () => {
  it('should create a validation error', () => {
    const error = new ValidationError('This is a test')
    expect(error.message).to.equal('Found 1 validation error\n  This is a test')
    expect(error.errors).to.eql([
      { path: [], message: 'This is a test' },
    ])
  })

  it('should create a validation error with a path', () => {
    const error1 = new ValidationError([ { path: [], message: 'This is a test' } ])
    expect(error1.message).to.equal('Found 1 validation error\n  This is a test')
    expect(error1.errors).to.eql([
      { path: [], message: 'This is a test' },
    ])

    const error2 = new ValidationError([ { path: [ 123 ], message: 'This is a test' } ])
    expect(error2.message).to.equal('Found 1 validation error\n  [123]: This is a test')
    expect(error2.errors).to.eql([
      { path: [ 123 ], message: 'This is a test' },
    ])

    const error3 = new ValidationError([ { path: [ 'foo' ], message: 'This is a test' } ])
    expect(error3.message).to.equal('Found 1 validation error\n  foo: This is a test')
    expect(error3.errors).to.eql([
      { path: [ 'foo' ], message: 'This is a test' },
    ])

    const error4 = new ValidationError([ { path: [ 'foo', 'bar', 123, 456, 'baz', 789 ], message: 'This is a test' } ])
    expect(error4.message).to.equal('Found 1 validation error\n  foo.bar[123][456].baz[789]: This is a test')
    expect(error4.errors).to.eql([
      { path: [ 'foo', 'bar', 123, 456, 'baz', 789 ], message: 'This is a test' },
    ])
  })

  it('should create a validation error with multiple errors', () => {
    const error = new ValidationError([
      { path: [ 'foo', 1 ], message: 'This is foo' },
      { path: [ 2, 'bar' ], message: 'This is bar' },
    ])

    expect(error.message).to.equal('Found 2 validation errors\n  foo[1]: This is foo\n  [2].bar: This is bar')
    expect(error.errors).to.eql([
      { path: [ 'foo', 1 ], message: 'This is foo' },
      { path: [ 2, 'bar' ], message: 'This is bar' },
    ])
  })
})
