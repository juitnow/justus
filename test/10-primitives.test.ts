import { any, bigint, BigIntValidator, boolean, constant, number, NumberValidator, string, StringValidator, validate, ValidationError } from '../src'

describe('Primitive validators', () => {
  describe('any', () => {
    it('should validate anything', () => {
      expect(validate(any, undefined)).toBeUndefined()
      expect(validate(any, 'foobar')).toStrictlyEqual('foobar')
    })
  })

  describe('boolean', () => {
    it('should validate a boolean', () => {
      expect(validate(boolean, true)).toBeTrue()
      expect(validate(boolean, false)).toBeFalse()
    })

    it('should validate a boolean from a string', () => {
      expect(validate(boolean({ fromString: true }), 'true')).toBeTrue()
      expect(validate(boolean({ fromString: true }), 'TRUE')).toBeTrue()
      expect(validate(boolean({ fromString: true }), 'false')).toBeFalse()
      expect(validate(boolean({ fromString: true }), 'FALSE')).toBeFalse()

      expect(() => validate(boolean({ fromString: true }), 'hello'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Boolean can not be parsed from string' },
              ])),
          )
    })

    it('should fail validating non booleans', () => {
      expect(() => validate(boolean, 'foobar'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value is not a "boolean"' },
              ])))

      expect(() => validate(boolean, undefined))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value is not a "boolean"' },
              ])))
    })
  })

  describe('constants', () => {
    it('should validate a constant', () => {
      expect(validate(constant(null), null)).toBeNull()
      expect(validate(constant(false), false)).toBeFalse()
      expect(validate(constant('foo'), 'foo')).toStrictlyEqual('foo')
      expect(validate(constant(12345), 12345)).toStrictlyEqual(12345)
      expect(validate(constant(1234n), 1234n)).toStrictlyEqual(1234n)

      expect(validate(null, null)).toBeNull()
      expect(validate(false as const, false)).toBeFalse()
      expect(validate('foo' as const, 'foo')).toStrictlyEqual('foo')
      expect(validate(12345, 12345)).toStrictlyEqual(12345)
      expect(validate(1234n, 1234n)).toStrictlyEqual(1234n)
    })

    it('should fail validating the wrong constant', () => {
      expect(() => validate(constant('foo'), 'bar'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value does not match constant "foo" (string)' },
              ])))

      expect(() => validate(constant(123n), 123))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value does not match constant "123" (bigint)' },
              ])))

      expect(() => validate(constant(123), 123n))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value does not match constant "123" (number)' },
              ])))

      expect(() => validate(constant(true), false))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value does not match constant "true" (boolean)' },
              ])))

      expect(() => validate(constant(null), undefined))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value does not match constant "null"' },
              ])))
    })
  })

  describe('number', () => {
    it('should validate a number', () => {
      expect(validate(number, 0)).toStrictlyEqual(0)
      expect(validate(number, 123.456)).toStrictlyEqual(123.456)
      expect(validate(number, Number.NEGATIVE_INFINITY)).toStrictlyEqual(Number.NEGATIVE_INFINITY)
      expect(validate(number, Number.POSITIVE_INFINITY)).toStrictlyEqual(Number.POSITIVE_INFINITY)

      expect(() => validate(number, 'foobar'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value is not a "number"' },
              ])))
    })

    it('should validate a number within a range', () => {
      const range = number({ minimum: -9, maximum: 19 })
      expect(validate(range, 0)).toStrictlyEqual(0)
      expect(validate(range, -9)).toStrictlyEqual(-9)
      expect(validate(range, 19)).toStrictlyEqual(19)

      expect(validate(number({ minimum: 0, maximum: 0 }), 0)).toStrictlyEqual(0)

      expect(() => validate(range, -10))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is less than -9' },
              ])))

      expect(() => validate(range, 20))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is greater than 19' },
              ])))

      expect(() => number({ minimum: 10, maximum: 9 }))
          .toThrowError(TypeError, 'Constraint "minimum" (10) is greater than "maximum" (9)')
    })

    it('should validate a number within an exclusive range', () => {
      const range1 = number({ exclusiveMinimum: 0, exclusiveMaximum: 1 })
      expect(validate(range1, 0.001)).toStrictlyEqual(0.001)
      expect(validate(range1, 0.999)).toStrictlyEqual(0.999)

      expect(() => validate(range1, 0))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is less than or equal to 0' },
              ])))

      expect(() => validate(range1, 1))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is greater than or equal to 1' },
              ])))

      const range2 = number({ exclusiveMinimum: 0, maximum: 1 })
      expect(validate(range2, 0.001)).toStrictlyEqual(0.001)
      expect(validate(range2, 1)).toStrictlyEqual(1)

      expect(() => validate(range2, 0))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is less than or equal to 0' },
              ])))

      expect(() => validate(range2, 1.001))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is greater than 1' },
              ])))

      const range3 = number({ minimum: 0, exclusiveMaximum: 1 })
      expect(validate(range3, 0)).toStrictlyEqual(0)
      expect(validate(range3, 0.999)).toStrictlyEqual(0.999)

      expect(() => validate(range3, -0.001))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is less than 0' },
              ])))

      expect(() => validate(range3, 1))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is greater than or equal to 1' },
              ])))

      expect(() => number({ exclusiveMinimum: 2, exclusiveMaximum: 1 }))
          .toThrowError(TypeError, 'Constraint "exclusiveMaximum" (1) must be greater than "exclusiveMinimum" (2)')
      expect(() => number({ exclusiveMinimum: 0, exclusiveMaximum: 0 }))
          .toThrowError(TypeError, 'Constraint "exclusiveMaximum" (0) must be greater than "exclusiveMinimum" (0)')

      expect(() => number({ exclusiveMinimum: 2, maximum: 1 }))
          .toThrowError(TypeError, 'Constraint "maximum" (1) must be greater than "exclusiveMinimum" (2)')
      expect(() => number({ exclusiveMinimum: 0, maximum: 0 }))
          .toThrowError(TypeError, 'Constraint "maximum" (0) must be greater than "exclusiveMinimum" (0)')

      expect(() => number({ minimum: 2, exclusiveMaximum: 1 }))
          .toThrowError(TypeError, 'Constraint "exclusiveMaximum" (1) must be greater than "minimum" (2)')
      expect(() => number({ minimum: 0, exclusiveMaximum: 0 }))
          .toThrowError(TypeError, 'Constraint "exclusiveMaximum" (0) must be greater than "minimum" (0)')
    })

    it('should validate multiple ofs', () => {
      // integers
      expect(validate(number({ multipleOf: 2 }), 4)).toStrictlyEqual(4)
      expect(() => validate(number({ multipleOf: 2 }), 3))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is not a multiple of 2' },
              ])))

      // reals
      expect(validate(number({ multipleOf: 0.01 }), 0.12)).toStrictlyEqual(0.12)
      expect(() => validate(number({ multipleOf: 0.03 }), 0.07))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is not a multiple of 0.03' },
              ])))

      expect(validate(number({ multipleOf: 0.000001 }), 0.123456)).toStrictlyEqual(0.123456)
      expect(validate(number({ multipleOf: 0.000001 }), 1000e100)).toStrictlyEqual(1000e100)

      expect(() => validate(number({ multipleOf: 0.000001 }), 0.0000001))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is not a multiple of 0.000001' },
              ])))

      // too much precision
      expect(() => number({ multipleOf: 0.123456 })).not.toThrow()
      expect(() => number({ multipleOf: 0.1234567 }))
          .toThrowError(TypeError, 'Constraint "multipleOf" (0.1234567) requires too much precision')

      // this is a magical number that _multiplied_ by our precision (1 000 000)
      // result in an integer (100820000)... so we need a different way to check
      // for how many decimal digits a number has...
      expect(() => validate(number({ multipleOf: 0.000001 }), 100.82000000000001 ))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is not a multiple of 0.000001' },
              ])))

      expect(() => validate(number({ multipleOf: 0.000001 }), Infinity ))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Can\'t calculate digits for number "Infinity"' },
              ])))
    })

    it('should validate NaN', () => {
      expect(() => validate(number, NaN))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is "NaN"' },
              ])))
      expect(() => validate(number({ allowNaN: false }), NaN))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number is "NaN"' },
              ])))
      expect(validate(number({ allowNaN: true }), NaN)).toBeNaN()
    })

    it('should validate a number parsing a string', () => {
      const validator = number({ fromString: true })
      expect(validate(validator, '123456'), '123456').toStrictlyEqual(123456)
      expect(validate(validator, '-12.34'), '-12.34').toStrictlyEqual(-12.34)
      expect(validate(validator, '0xCAFE'), '0xCAFE').toStrictlyEqual(0xCAFE)
      expect(validate(validator, '0o4321'), '0o4321').toStrictlyEqual(0o4321)
      expect(validate(validator, '0b1011'), '0b1011').toStrictlyEqual(0b1011)
      expect(() => validate(validator, 'hello'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Number can not be parsed from string' },
              ])))
    })

    it('should validate a number using the NumberValidator class', () => {
      const validator = new NumberValidator()
      expect(validate(validator, 12345)).toStrictlyEqual(12345)
    })

    it('should support implicit branding', () => {
      const validator = number({ brand: 'foo' })
      expect(validate(validator, 12345)).toStrictlyEqual(12345)
      expect(validator.brand).toStrictlyEqual('foo')
    })
  })

  describe('string', () => {
    it('should validate a string', () => {
      expect(validate(string, 'foobar')).toStrictlyEqual('foobar')
      expect(validate(string, '')).toStrictlyEqual('')

      expect(() => validate(string, 123))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value is not a "string"' },
              ])))
    })

    it('should validate a string of a specified length', () => {
      const length = string({ minLength: 3, maxLength: 6 })
      expect(validate(length, 'foo')).toStrictlyEqual('foo')
      expect(validate(length, 'foobar')).toStrictlyEqual('foobar')
      expect(() => validate(length, 'fo'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'String must have a minimum length of 3' },
              ])))
      expect(() => validate(length, 'foobarx'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'String must have a maximum length of 6' },
              ])))

      expect(validate(string({ minLength: 3, maxLength: 3 }), 'foo')).toStrictlyEqual('foo')

      expect(() => string({ minLength: -1 }))
          .toThrowError(TypeError, 'Constraint "minLength" (-1) must be non-negative')
      expect(() => string({ maxLength: -1 }))
          .toThrowError(TypeError, 'Constraint "maxLength" (-1) must be non-negative')
      expect(() => string({ minLength: 4, maxLength: 3 }))
          .toThrowError(TypeError, 'Constraint "minLength" (4) is greater than "maxLength" (3)')
    })

    it('should validate a string a with a pattern', () => {
      expect(validate(string({ pattern: /^foobar$/ }), 'foobar')).toStrictlyEqual('foobar')
      expect(() => validate(string({ pattern: /^$/ }), 'foobar'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'String does not match required pattern /^$/' },
              ])))
    })

    it('should validate a string using the StringValidator class', () => {
      const validator = new StringValidator()
      expect(validate(validator, 'foo')).toStrictlyEqual('foo')
    })

    it('should support implicit branding', () => {
      const validator = string({ brand: 'foo' })
      expect(validate(validator, 'foo')).toStrictlyEqual('foo')
      expect(validator.brand).toStrictlyEqual('foo')
    })
  })

  describe('bigint', () => {
    it('should validate a bigint', () => {
      expect(validate(bigint, 0n)).toStrictlyEqual(0n)
      expect(validate(bigint, 123n)).toStrictlyEqual(123n)

      expect(validate(bigint, 0)).toStrictlyEqual(0n)
      expect(validate(bigint, 123)).toStrictlyEqual(123n)

      expect(() => validate(bigint, 123.456))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt can not be parsed from number' },
              ])))

      expect(() => validate(bigint, '12345'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value is not a "bigint"' },
              ])))
    })

    it('should validate a bigint within a range', () => {
      const range = bigint({ minimum: -9, maximum: 19 })
      expect(validate(range, 0)).toStrictlyEqual(0n)
      expect(validate(range, -9)).toStrictlyEqual(-9n)
      expect(validate(range, 19)).toStrictlyEqual(19n)

      expect(validate(bigint({ minimum: 0, maximum: 0 }), 0)).toStrictlyEqual(0n)

      expect(() => validate(range, -10))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt is less than -9' },
              ])))

      expect(() => validate(range, 20))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt is greater than 19' },
              ])))

      expect(() => bigint({ minimum: 10, maximum: 9 }))
          .toThrowError(TypeError, 'Constraint "minimum" (10) is greater than "maximum" (9)')
    })

    it('should validate a bigint within an exclusive range', () => {
      const range1 = bigint({ exclusiveMinimum: 0, exclusiveMaximum: 10 })
      expect(validate(range1, 1)).toStrictlyEqual(1n)
      expect(validate(range1, 9)).toStrictlyEqual(9n)

      expect(() => validate(range1, 0))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt is less than or equal to 0' },
              ])))

      expect(() => validate(range1, 10))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt is greater than or equal to 10' },
              ])))

      const range2 = bigint({ exclusiveMinimum: 0, maximum: 10 })
      expect(validate(range2, 1)).toStrictlyEqual(1n)
      expect(validate(range2, 10)).toStrictlyEqual(10n)

      expect(() => validate(range2, 0))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt is less than or equal to 0' },
              ])))

      expect(() => validate(range2, 11))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt is greater than 10' },
              ])))

      const range3 = bigint({ minimum: 0, exclusiveMaximum: 10 })
      expect(validate(range3, 0)).toStrictlyEqual(0n)
      expect(validate(range3, 9)).toStrictlyEqual(9n)

      expect(() => validate(range3, -1))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt is less than 0' },
              ])))

      expect(() => validate(range3, 10))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt is greater than or equal to 10' },
              ])))

      expect(() => bigint({ exclusiveMinimum: 2, exclusiveMaximum: 1 }))
          .toThrowError(TypeError, 'Constraint "exclusiveMaximum" (1) must be greater than "exclusiveMinimum" (2)')
      expect(() => bigint({ exclusiveMinimum: 0, exclusiveMaximum: 0 }))
          .toThrowError(TypeError, 'Constraint "exclusiveMaximum" (0) must be greater than "exclusiveMinimum" (0)')

      expect(() => bigint({ exclusiveMinimum: 2, maximum: 1 }))
          .toThrowError(TypeError, 'Constraint "maximum" (1) must be greater than "exclusiveMinimum" (2)')
      expect(() => bigint({ exclusiveMinimum: 0, maximum: 0 }))
          .toThrowError(TypeError, 'Constraint "maximum" (0) must be greater than "exclusiveMinimum" (0)')

      expect(() => bigint({ minimum: 2, exclusiveMaximum: 1 }))
          .toThrowError(TypeError, 'Constraint "exclusiveMaximum" (1) must be greater than "minimum" (2)')
      expect(() => bigint({ minimum: 0, exclusiveMaximum: 0 }))
          .toThrowError(TypeError, 'Constraint "exclusiveMaximum" (0) must be greater than "minimum" (0)')
    })

    it('should validate multiple ofs', () => {
      expect(validate(bigint({ multipleOf: 2 }), 4)).toStrictlyEqual(4n)
      expect(() => validate(bigint({ multipleOf: 2 }), 3))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt is not a multiple of 2' },
              ])))
    })

    it('should validate a bigint parsing a string', () => {
      const validator = bigint({ fromString: true })
      expect(validate(validator, '123456'), '123456').toStrictlyEqual(123456n)
      expect(validate(validator, '0xCAFE'), '0xCAFE').toStrictlyEqual(0xCAFEn)
      expect(validate(validator, '0o4321'), '0o4321').toStrictlyEqual(0o4321n)
      expect(validate(validator, '0b1011'), '0b1011').toStrictlyEqual(0b1011n)
      expect(() => validate(validator, '123.456'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt can not be parsed from string' },
              ])))
    })

    it('should validate a bigint parsing a number', () => {
      const validator = bigint({ fromNumber: true })
      expect(validate(validator, 123456), '123456').toStrictlyEqual(123456n)

      expect(() => validate(validator, 123.456))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'BigInt can not be parsed from number' },
              ])))

      const validator2 = bigint({ fromNumber: false })
      expect(() => validate(validator2, 123456), '123456')
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error/)
              .toHaveProperty('errors', expect.toMatchContents([
                { path: [], message: 'Value is not a "bigint"' },
              ])))
    })

    it('should validate a bigint using the BigIntValidator class', () => {
      const validator = new BigIntValidator()
      expect(validate(validator, 12345n)).toStrictlyEqual(12345n)
    })

    it('should support implicit branding', () => {
      const validator = bigint({ brand: 'foo' })
      expect(validate(validator, 12345n)).toStrictlyEqual(12345n)
      expect(validator.brand).toStrictlyEqual('foo')
    })
  })
})
