import { assertSchema, assertValidation, ValidationError, ValidationErrorBuilder } from '../src'

describe('Errors', () => {
  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const error = new ValidationError('This is a test')
      expect(error.message).toStrictlyEqual('Found 1 validation error\n  This is a test')
      expect(error.errors).toEqual([
        { path: [], message: 'This is a test' },
      ])
    })

    it('should create a validation error with a path', () => {
      const error1 = new ValidationError('This is a test', [])
      expect(error1.message).toStrictlyEqual('Found 1 validation error\n  This is a test')
      expect(error1.errors).toEqual([
        { path: [], message: 'This is a test' },
      ])

      const error2 = new ValidationError('This is a test', [ 123 ])
      expect(error2.message).toStrictlyEqual('Found 1 validation error\n  [123]: This is a test')
      expect(error2.errors).toEqual([
        { path: [ 123 ], message: 'This is a test' },
      ])

      const error3 = new ValidationError('This is a test', [ 'foo' ])
      expect(error3.message).toStrictlyEqual('Found 1 validation error\n  foo: This is a test')
      expect(error3.errors).toEqual([
        { path: [ 'foo' ], message: 'This is a test' },
      ])

      const error4 = new ValidationError('This is a test', [ 'foo', 'bar', 123, 456, 'baz', 789 ])
      expect(error4.message).toStrictlyEqual('Found 1 validation error\n  foo.bar[123][456].baz[789]: This is a test')
      expect(error4.errors).toEqual([
        { path: [ 'foo', 'bar', 123, 456, 'baz', 789 ], message: 'This is a test' },
      ])
    })

    it('should wrap another ValidationError', () => {
      const error0 = new ValidationError('This is a test', [ 123 ])
      const error1 = new ValidationError(error0, [ 'foo' ])

      expect(error1.message).toStrictlyEqual('Found 1 validation error\n  foo[123]: This is a test')
      expect(error1.errors).toEqual([
        { path: [ 'foo', 123 ], message: 'This is a test' },
      ])
    })

    it('should create a validation error ignoring certain stack trace elements', () => {
      function _testCreate_(
          constructorOrPath?: Function | string[],
          maybeConstructor?: Function,
      ): ValidationError {
        return new ValidationError('This is a test', <any> constructorOrPath, <any> maybeConstructor)
      }

      expect(_testCreate_().stack.match(/^\s+at\s+.*_testCreate_/gm)).toBeA('array')
      expect(_testCreate_(_testCreate_).stack.match(/^\s+at\s+.*_testCreate_/gm)).toBeNull()
      expect(_testCreate_([]).stack.match(/^\s+at\s+.*_testCreate_/gm)).toBeA('array')
      expect(_testCreate_([], _testCreate_).stack.match(/^\s+at\s+.*_testCreate_/gm)).toBeNull()
    })
  })

  describe('ValidationError Builder', () => {
    it('should not throw when no errors have been recorded', () => {
      const object = {}
      expect(new ValidationErrorBuilder().assert(object)).toStrictlyEqual(object)
    })

    it('should throw when a simple error have been recorded', () => {
      const builder = new ValidationErrorBuilder()
          .record('Hello, world!')
          .record('Something else', 'myKey')

      expect(() => builder.assert(null)).toThrow((assert) => assert
          .toBeError(ValidationError, /^Found 2 validation errors/)
          .toHaveProperty('errors', expect.toMatchContents([
            { path: [], message: 'Hello, world!' },
            { path: [ 'myKey' ], message: 'Something else' },
          ])))
    })

    it('should properly wrap another ValidationError', () => {
      const error1 = new ValidationError('This has no path')
      const error2 = new ValidationError('A message', [ 'myKey' ])

      const builder = new ValidationErrorBuilder()
          .record(error1)
          .record(error2)
          .record(error1, 123)
          .record(error2, 456)

      expect(() => builder.assert(null)).toThrow((assert) => assert
          .toBeError(ValidationError, /^Found 4 validation errors/)
          .toHaveProperty('errors', expect.toMatchContents([
            { path: [], message: 'This has no path' },
            { path: [ 'myKey' ], message: 'A message' },
            { path: [ 123 ], message: 'This has no path' },
            { path: [ 456, 'myKey' ], message: 'A message' },
          ])))
    })
  })

  describe('Assertions', () => {
    it('should assert a schema error', () => {
      expect(() => assertSchema(true, 'This should not throw')).not.toThrow()
      expect(() => assertSchema(false, 'This should throw'))
          .toThrowError(TypeError, 'This should throw')
    })

    it('should assert a validation error', () => {
      expect(() => assertValidation(true, 'This should not throw')).not.toThrow()
      expect(() => assertValidation(false, 'This should throw'))
          .toThrow((assert) => assert.toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([ {
                path: [], message: 'This should throw',
              } ])))
    })
  })
})
