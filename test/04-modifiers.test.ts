import { expect } from 'chai'
import { any, boolean, optional, readonly, string } from '../src'

describe('Object modifiers', () => {
  it('should construct a "readonly" modifier', () => {
    expect(readonly()).to.eql({
      modifier: any,
      readonly: true,
    })

    expect(readonly(boolean)).to.eql({
      modifier: boolean,
      readonly: true,
    })

    const validator = string()

    const modified = readonly(validator)
    expect(modified).to.eql({
      modifier: validator,
      readonly: true,
    })
  })

  it('should construct a "optional" modifier', () => {
    expect(optional()).to.eql({
      modifier: any,
      optional: true,
    })

    expect(optional(boolean)).to.eql({
      modifier: boolean,
      optional: true,
    })

    const validator = string()

    const modified = optional(validator)
    expect(modified).to.eql({
      modifier: validator,
      optional: true,
    })
  })

  it('should combine modifiers', () => {
    const validator = string()

    const r = readonly(validator)
    expect(r).to.eql({
      modifier: validator,
      readonly: true,
    })

    expect(readonly(r)).to.eql({
      modifier: validator,
      readonly: true,
    })

    expect(optional(r)).to.eql({
      modifier: validator,
      readonly: true,
      optional: true,
    })

    const o = optional(validator)
    expect(o).to.eql({
      modifier: validator,
      optional: true,
    })

    expect(optional(o)).to.eql({
      modifier: validator,
      optional: true,
    })

    expect(readonly(o)).to.eql({
      modifier: validator,
      readonly: true,
      optional: true,
    })
  })
})
