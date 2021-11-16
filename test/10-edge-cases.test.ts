import { expect } from 'chai'
import { validate } from '../src'

describe('Edge cases', () => {
  it('should not validate without a validator', () => {
    expect(() => validate({} as any, null))
        .to.throw(TypeError, 'Invalid validation (type=object)')
  })
})
