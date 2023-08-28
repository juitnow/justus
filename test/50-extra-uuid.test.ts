import { ValidationError, validate } from '../src'
import { uuid } from '../src/extra/uuid'

describe('Extra UUID validator', () => {
  it('should validate and normalize an UUID', () => {
    expect(validate(uuid, 'BD075D99-1114-45B4-8B71-45C0EB89589C'))
        .toStrictlyEqual('bd075d99-1114-45b4-8b71-45c0eb89589c')
  })

  it('should reject a short UUID', () => {
    expect(() => validate(uuid, ''))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error$/m)
            .toHaveProperty('errors', (assert) => assert.toEqual([ {
              message: 'String must have a minimum length of 36',
              path: [],
            } ])),
        )
  })

  it('should reject a long UUID', () => {
    expect(() => validate(uuid, '00000000000000000000000000000000000000000000'))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error$/m)
            .toHaveProperty('errors', (assert) => assert.toEqual([ {
              message: 'String must have a maximum length of 36',
              path: [],
            } ])),
        )
  })

  it('should reject an invalid UUID', () => {
    expect(() => validate(uuid, 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error$/m)
            .toHaveProperty('errors', (assert) => assert.toEqual([ {
              message: expect.toMatch(/^String does not match required pattern /),
              path: [],
            } ])),
        )
  })
})
