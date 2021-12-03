import { expect } from 'chai'
import { any, boolean, modifierValidator, number, object, optional, readonly, string, validate, ValidationError } from '../src'

describe('Object modifiers', () => {
  it('should construct a "readonly" modifier', () => {
    expect(readonly()).to.eql({
      [modifierValidator]: any,
      readonly: true,
    })

    expect(readonly(boolean)).to.eql({
      [modifierValidator]: boolean,
      readonly: true,
    })

    const validator = string()

    const modified = readonly(validator)
    expect(modified).to.eql({
      [modifierValidator]: validator,
      readonly: true,
    })
  })

  it('should construct a "optional" modifier', () => {
    expect(optional()).to.eql({
      [modifierValidator]: any,
      optional: true,
    })

    expect(optional(boolean)).to.eql({
      [modifierValidator]: boolean,
      optional: true,
    })

    const validator = string()

    const modified = optional(validator)
    expect(modified).to.eql({
      [modifierValidator]: validator,
      optional: true,
    })
  })

  it('should combine modifiers', () => {
    const validator = string()

    const r = readonly(validator)
    expect(r).to.eql({
      [modifierValidator]: validator,
      readonly: true,
    })

    expect(readonly(r)).to.eql({
      [modifierValidator]: validator,
      readonly: true,
    })

    expect(optional(r)).to.eql({
      [modifierValidator]: validator,
      readonly: true,
      optional: true,
    })

    const o = optional(validator)
    expect(o).to.eql({
      [modifierValidator]: validator,
      optional: true,
    })

    expect(optional(o)).to.eql({
      [modifierValidator]: validator,
      optional: true,
    })

    expect(readonly(o)).to.eql({
      [modifierValidator]: validator,
      readonly: true,
      optional: true,
    })
  })

  it('should validate an object with optional properties', () => {
    const schema1 = object({
      foo: string,
      bar: optional(number({ minimum: 50 })),
      baz: readonly(number({ maximum: 50 })),
    })

    expect(validate(schema1, { foo: 'hello', bar: 50, baz: 50 }))
        .to.eql({ foo: 'hello', bar: 50, baz: 50 })

    expect(validate(schema1, { foo: 'hello', baz: 50 }))
        .to.eql({ foo: 'hello', baz: 50 })

    expect(() => validate(schema1, { foo: 'hello', bar: 40, baz: 60 }))
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').eql([
          { path: [ 'bar' ], message: 'Number is less than 50' },
          { path: [ 'baz' ], message: 'Number is greater than 50' },
        ])
  })
})
