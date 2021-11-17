import { expect } from 'chai'
import { object, validate, Validator } from '../src'

describe('Edge cases', () => {
  it('should expose the Validator class', () => {
    expect(Validator).to.be.a('function')
  })

  it('should not validate without a validator', () => {
    expect(() => validate({} as any, null))
        .to.throw(TypeError, 'Invalid validation (type=object)')
  })

  it('should not accept arbitrary schema values', () => {
    expect(() => object({ foo: {} } as any))
        .to.throw(TypeError, 'Invalid property in schema for key "foo"')
  })
})
