import { expect } from 'chai'

import { any, bigint, BigIntValidator, boolean, constant, number, NumberValidator, string, StringValidator, validate, ValidationError } from '../src'

describe('Primitive validators', () => {
  describe('any', () => {
    it('should validate anything', () => {
      expect(validate(any, undefined)).to.be.undefined
      expect(validate(any, 'foobar')).to.equal('foobar')
    })
  })

  describe('boolean', () => {
    it('should validate a boolean', () => {
      expect(validate(boolean, true)).to.be.true
      expect(validate(boolean, false)).to.be.false
    })

    it('should validate a boolean from a string', () => {
      expect(validate(boolean({ fromString: true }), 'true')).to.be.true
      expect(validate(boolean({ fromString: true }), 'TRUE')).to.be.true
      expect(validate(boolean({ fromString: true }), 'false')).to.be.false
      expect(validate(boolean({ fromString: true }), 'FALSE')).to.be.false

      expect(() => validate(boolean({ fromString: true }), 'hello'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Boolean can not be parsed from string' },
          ])
    })

    it('should fail validating non booleans', () => {
      expect(() => validate(boolean, 'foobar'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Value is not a "boolean"' },
          ])

      expect(() => validate(boolean, undefined))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Value is not a "boolean"' },
          ])
    })
  })

  describe('constants', () => {
    it('should validate a constant', () => {
      expect(validate(constant(null), null)).to.be.null
      expect(validate(constant(false), false)).to.be.false
      expect(validate(constant('foo'), 'foo')).to.equal('foo')
      expect(validate(constant(12345), 12345)).to.equal(12345)
      expect(validate(constant(1234n), 1234n)).to.equal(1234n)

      expect(validate(null, null)).to.be.null
      expect(validate(false as const, false)).to.be.false
      expect(validate('foo' as const, 'foo')).to.equal('foo')
      expect(validate(12345, 12345)).to.equal(12345)
      expect(validate(1234n, 1234n)).to.equal(1234n)
    })

    it('should fail validating the wrong constant', () => {
      expect(() => validate(constant('foo'), 'bar'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Value does not match constant "foo"' },
          ])

      expect(() => validate(constant(true), false))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Value does not match constant "true"' },
          ])

      expect(() => validate(constant(null), undefined))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Value does not match constant "null"' },
          ])
    })
  })

  describe('number', () => {
    it('should validate a number', () => {
      expect(validate(number, 0)).to.equal(0)
      expect(validate(number, 123.456)).to.equal(123.456)
      expect(validate(number, Number.NEGATIVE_INFINITY)).to.equal(Number.NEGATIVE_INFINITY)
      expect(validate(number, Number.POSITIVE_INFINITY)).to.equal(Number.POSITIVE_INFINITY)

      expect(() => validate(number, 'foobar'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Value is not a "number"' },
          ])
    })

    it('should validate a number within a range', () => {
      const range = number({ minimum: -9, maximum: 19 })
      expect(validate(range, 0)).to.equal(0)
      expect(validate(range, -9)).to.equal(-9)
      expect(validate(range, 19)).to.equal(19)

      expect(validate(number({ minimum: 0, maximum: 0 }), 0)).to.equal(0)

      expect(() => validate(range, -10))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is less than -9' },
          ])

      expect(() => validate(range, 20))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is greater than 19' },
          ])

      expect(() => number({ minimum: 10, maximum: 9 }))
          .to.throw(TypeError, 'Constraint "minimum" (10) is greater than "maximum" (9)')
    })

    it('should validate a number within an exclusive range', () => {
      const range1 = number({ exclusiveMinimum: 0, exclusiveMaximum: 1 })
      expect(validate(range1, 0.001)).to.equal(0.001)
      expect(validate(range1, 0.999)).to.equal(0.999)

      expect(() => validate(range1, 0))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is less than or equal to 0' },
          ])

      expect(() => validate(range1, 1))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is greater than or equal to 1' },
          ])

      const range2 = number({ exclusiveMinimum: 0, maximum: 1 })
      expect(validate(range2, 0.001)).to.equal(0.001)
      expect(validate(range2, 1)).to.equal(1)

      expect(() => validate(range2, 0))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is less than or equal to 0' },
          ])

      expect(() => validate(range2, 1.001))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is greater than 1' },
          ])

      const range3 = number({ minimum: 0, exclusiveMaximum: 1 })
      expect(validate(range3, 0)).to.equal(0)
      expect(validate(range3, 0.999)).to.equal(0.999)

      expect(() => validate(range3, -0.001))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is less than 0' },
          ])

      expect(() => validate(range3, 1))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is greater than or equal to 1' },
          ])

      expect(() => number({ exclusiveMinimum: 2, exclusiveMaximum: 1 }))
          .to.throw(TypeError, 'Constraint "exclusiveMaximum" (1) must be greater than "exclusiveMinimum" (2)')
      expect(() => number({ exclusiveMinimum: 0, exclusiveMaximum: 0 }))
          .to.throw(TypeError, 'Constraint "exclusiveMaximum" (0) must be greater than "exclusiveMinimum" (0)')

      expect(() => number({ exclusiveMinimum: 2, maximum: 1 }))
          .to.throw(TypeError, 'Constraint "maximum" (1) must be greater than "exclusiveMinimum" (2)')
      expect(() => number({ exclusiveMinimum: 0, maximum: 0 }))
          .to.throw(TypeError, 'Constraint "maximum" (0) must be greater than "exclusiveMinimum" (0)')

      expect(() => number({ minimum: 2, exclusiveMaximum: 1 }))
          .to.throw(TypeError, 'Constraint "exclusiveMaximum" (1) must be greater than "minimum" (2)')
      expect(() => number({ minimum: 0, exclusiveMaximum: 0 }))
          .to.throw(TypeError, 'Constraint "exclusiveMaximum" (0) must be greater than "minimum" (0)')
    })

    it('should validate multiple ofs', () => {
      // integers
      expect(validate(number({ multipleOf: 2 }), 4)).to.equal(4)
      expect(() => validate(number({ multipleOf: 2 }), 3))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is not a multiple of 2' },
          ])

      // reals
      expect(validate(number({ multipleOf: 0.01 }), 0.12)).to.equal(0.12)
      expect(() => validate(number({ multipleOf: 0.03 }), 0.07))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is not a multiple of 0.03' },
          ])

      expect(validate(number({ multipleOf: 0.000001 }), 0.123456)).to.equal(0.123456)
      expect(validate(number({ multipleOf: 0.000001 }), 1000e100)).to.equal(1000e100)

      expect(() => validate(number({ multipleOf: 0.000001 }), 0.0000001))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is not a multiple of 0.000001' },
          ])

      // too much precision
      expect(() => number({ multipleOf: 0.123456 })).to.not.throw()
      expect(() => number({ multipleOf: 0.1234567 }))
          .to.throw(TypeError, 'Constraint "multipleOf" (0.1234567) requires too much precision')

      // this is a magical number that _multiplied_ by our precision (1 000 000)
      // result in an integer (100820000)... so we need a different way to check
      // for how many decimal digits a number has...
      expect(() => validate(number({ multipleOf: 0.000001 }), 100.82000000000001 ))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is not a multiple of 0.000001' },
          ])

      expect(() => validate(number({ multipleOf: 0.000001 }), Infinity ))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Can\'t calculate digits for number "Infinity"' },
          ])
    })

    it('should validate NaN', () => {
      expect(() => validate(number, NaN))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is "NaN"' },
          ])
      expect(() => validate(number({ allowNaN: false }), NaN))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is "NaN"' },
          ])
      expect(validate(number({ allowNaN: true }), NaN)).to.be.NaN
    })

    it('should validate a number parsing a string', () => {
      const validator = number({ fromString: true })
      expect(validate(validator, '123456'), '123456').to.equal(123456)
      expect(validate(validator, '-12.34'), '-12.34').to.equal(-12.34)
      expect(validate(validator, '0xCAFE'), '0xCAFE').to.equal(0xCAFE)
      expect(validate(validator, '0o4321'), '0o4321').to.equal(0o4321)
      expect(validate(validator, '0b1011'), '0b1011').to.equal(0b1011)
      expect(() => validate(validator, 'hello'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number can not be parsed from string' },
          ])
    })

    it('should validate a number using the NumberValidator class', () => {
      const validator = new NumberValidator()
      expect(validate(validator, 12345)).to.equal(12345)
    })

    it('should support implicit branding', () => {
      const validator = number({ brand: 'foo' })
      expect(validate(validator, 12345)).to.equal(12345)
      expect(validator.brand).to.equal('foo')
    })
  })

  describe('string', () => {
    it('should validate a string', () => {
      expect(validate(string, 'foobar')).to.equal('foobar')
      expect(validate(string, '')).to.equal('')

      expect(() => validate(string, 123))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Value is not a "string"' },
          ])
    })

    it('should validate a string of a specified length', () => {
      const length = string({ minLength: 3, maxLength: 6 })
      expect(validate(length, 'foo')).to.equal('foo')
      expect(validate(length, 'foobar')).to.equal('foobar')
      expect(() => validate(length, 'fo'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'String must have a minimum length of 3' },
          ])
      expect(() => validate(length, 'foobarx'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'String must have a maximum length of 6' },
          ])

      expect(validate(string({ minLength: 3, maxLength: 3 }), 'foo')).to.equal('foo')

      expect(() => string({ minLength: -1 }))
          .to.throw(TypeError, 'Constraint "minLength" (-1) must be non-negative')
      expect(() => string({ maxLength: -1 }))
          .to.throw(TypeError, 'Constraint "maxLength" (-1) must be non-negative')
      expect(() => string({ minLength: 4, maxLength: 3 }))
          .to.throw(TypeError, 'Constraint "minLength" (4) is greater than "maxLength" (3)')
    })

    it('should validate a string a with a pattern', () => {
      expect(validate(string({ pattern: /^foobar$/ }), 'foobar')).to.equal('foobar')
      expect(() => validate(string({ pattern: /^$/ }), 'foobar'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'String does not match required pattern /^$/' },
          ])
    })

    it('should validate a string using the StringValidator class', () => {
      const validator = new StringValidator()
      expect(validate(validator, 'foo')).to.equal('foo')
    })

    it('should support implicit branding', () => {
      const validator = string({ brand: 'foo' })
      expect(validate(validator, 'foo')).to.equal('foo')
      expect(validator.brand).to.equal('foo')
    })
  })

  describe('bigint', () => {
    it('should validate a bigint', () => {
      expect(validate(bigint, 0n)).to.equal(0n)
      expect(validate(bigint, 123n)).to.equal(123n)

      expect(validate(bigint, 0)).to.equal(0n)
      expect(validate(bigint, 123)).to.equal(123n)

      expect(() => validate(bigint, 123.456))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt can not be parsed from number' },
          ])

      expect(() => validate(bigint, '12345'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Value is not a "bigint"' },
          ])
    })

    it('should validate a bigint within a range', () => {
      const range = bigint({ minimum: -9, maximum: 19 })
      expect(validate(range, 0)).to.equal(0n)
      expect(validate(range, -9)).to.equal(-9n)
      expect(validate(range, 19)).to.equal(19n)

      expect(validate(bigint({ minimum: 0, maximum: 0 }), 0)).to.equal(0n)

      expect(() => validate(range, -10))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt is less than -9' },
          ])

      expect(() => validate(range, 20))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt is greater than 19' },
          ])

      expect(() => bigint({ minimum: 10, maximum: 9 }))
          .to.throw(TypeError, 'Constraint "minimum" (10) is greater than "maximum" (9)')
    })

    it('should validate a bigint within an exclusive range', () => {
      const range1 = bigint({ exclusiveMinimum: 0, exclusiveMaximum: 10 })
      expect(validate(range1, 1)).to.equal(1n)
      expect(validate(range1, 9)).to.equal(9n)

      expect(() => validate(range1, 0))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt is less than or equal to 0' },
          ])

      expect(() => validate(range1, 10))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt is greater than or equal to 10' },
          ])

      const range2 = bigint({ exclusiveMinimum: 0, maximum: 10 })
      expect(validate(range2, 1)).to.equal(1n)
      expect(validate(range2, 10)).to.equal(10n)

      expect(() => validate(range2, 0))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt is less than or equal to 0' },
          ])

      expect(() => validate(range2, 11))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt is greater than 10' },
          ])

      const range3 = bigint({ minimum: 0, exclusiveMaximum: 10 })
      expect(validate(range3, 0)).to.equal(0n)
      expect(validate(range3, 9)).to.equal(9n)

      expect(() => validate(range3, -1))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt is less than 0' },
          ])

      expect(() => validate(range3, 10))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt is greater than or equal to 10' },
          ])

      expect(() => bigint({ exclusiveMinimum: 2, exclusiveMaximum: 1 }))
          .to.throw(TypeError, 'Constraint "exclusiveMaximum" (1) must be greater than "exclusiveMinimum" (2)')
      expect(() => bigint({ exclusiveMinimum: 0, exclusiveMaximum: 0 }))
          .to.throw(TypeError, 'Constraint "exclusiveMaximum" (0) must be greater than "exclusiveMinimum" (0)')

      expect(() => bigint({ exclusiveMinimum: 2, maximum: 1 }))
          .to.throw(TypeError, 'Constraint "maximum" (1) must be greater than "exclusiveMinimum" (2)')
      expect(() => bigint({ exclusiveMinimum: 0, maximum: 0 }))
          .to.throw(TypeError, 'Constraint "maximum" (0) must be greater than "exclusiveMinimum" (0)')

      expect(() => bigint({ minimum: 2, exclusiveMaximum: 1 }))
          .to.throw(TypeError, 'Constraint "exclusiveMaximum" (1) must be greater than "minimum" (2)')
      expect(() => bigint({ minimum: 0, exclusiveMaximum: 0 }))
          .to.throw(TypeError, 'Constraint "exclusiveMaximum" (0) must be greater than "minimum" (0)')
    })

    it('should validate multiple ofs', () => {
      expect(validate(bigint({ multipleOf: 2 }), 4)).to.equal(4n)
      expect(() => validate(bigint({ multipleOf: 2 }), 3))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt is not a multiple of 2' },
          ])
    })

    it('should validate a bigint parsing a string', () => {
      const validator = bigint({ fromString: true })
      expect(validate(validator, '123456'), '123456').to.equal(123456n)
      expect(validate(validator, '0xCAFE'), '0xCAFE').to.equal(0xCAFEn)
      expect(validate(validator, '0o4321'), '0o4321').to.equal(0o4321n)
      expect(validate(validator, '0b1011'), '0b1011').to.equal(0b1011n)
      expect(() => validate(validator, '123.456'))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt can not be parsed from string' },
          ])
    })

    it('should validate a bigint parsing a number', () => {
      const validator = bigint({ fromNumber: true })
      expect(validate(validator, 123456), '123456').to.equal(123456n)

      expect(() => validate(validator, 123.456))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'BigInt can not be parsed from number' },
          ])

      const validator2 = bigint({ fromNumber: false })
      expect(() => validate(validator2, 123456), '123456')
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Value is not a "bigint"' },
          ])
    })

    it('should validate a bigint using the BigIntValidator class', () => {
      const validator = new BigIntValidator()
      expect(validate(validator, 12345n)).to.equal(12345n)
    })

    it('should support implicit branding', () => {
      const validator = bigint({ brand: 'foo' })
      expect(validate(validator, 12345n)).to.equal(12345n)
      expect(validator.brand).to.equal('foo')
    })
  })
})
