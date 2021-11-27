import { ValidationError, any, boolean, validate, number, constant, string } from '../src'
import { expect } from 'chai'

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

      expect(validate(null, null)).to.be.null
      expect(validate(false as const, false)).to.be.false
      expect(validate('foo' as const, 'foo')).to.equal('foo')
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
      expect(() => validate(number({ multipleOf: 0.000001 }), 0.0000001))
          .to.throw(ValidationError, 'Found 1 validation error')
          .with.property('errors').to.eql([
            { path: [], message: 'Number is not a multiple of 0.000001' },
          ])

      // too much precision
      expect(() => number({ multipleOf: 1.2345678 }))
          .to.throw(TypeError, 'Constraint "multipleOf" (1.2345678) requires too much precision')
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
  })
})
