import { ValidationError } from '../src'
import { expect } from 'chai'
import { assertSchema, assertValidation, ValidationErrorBuilder } from '../src/errors'

describe('Errors', () => {
  describe('ValidationError', () => {
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

  describe('ValidationError Builder', () => {
    it('should not throw when no errors have been recorded', () => {
      const object = {}
      expect(new ValidationErrorBuilder().assert(object)).to.equal(object)
    })

    it('should throw when a simple error have been recorded', () => {
      const builder = new ValidationErrorBuilder()
          .record('Hello, world!')
          .record('Something else', 'myKey')

      expect(() => builder.assert(null))
          .to.throw(ValidationError, 'Found 2 validation errors')
          .with.property('errors').to.eql([
            { path: [], message: 'Hello, world!' },
            { path: [ 'myKey' ], message: 'Something else' },
          ])
    })

    it('should properly wrap another ValidationError', () => {
      const error1 = new ValidationError('This has no path')
      const error2 = new ValidationError([ { path: [ 'myKey' ], message: 'A message' } ])

      const builder = new ValidationErrorBuilder()
          .record(error1)
          .record(error2)
          .record(error1, 123)
          .record(error2, 456)

      expect(() => builder.assert(null))
          .to.throw(ValidationError, 'Found 4 validation errors')
          .with.property('errors').to.eql([
            { path: [], message: 'This has no path' },
            { path: [ 'myKey' ], message: 'A message' },
            { path: [ 123 ], message: 'This has no path' },
            { path: [ 456, 'myKey' ], message: 'A message' },
          ])
    })
  })

  describe('Assertions', () => {
    it('should assert a schema error', () => {
      expect(() => assertSchema(true, 'This should not throw')).to.not.throw()
      expect(() => assertSchema(false, 'This should throw'))
          .to.throw(TypeError, 'This should throw')
    })

    it('should assert a validation error', () => {
      expect(() => assertValidation(true, 'This should not throw')).to.not.throw()
      expect(() => assertValidation(false, 'This should throw'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([ {
            path: [], message: 'This should throw',
          } ])
    })
  })
})
