import { ValidationError, validate } from '../src'
import { email } from '../src/extra/email'

describe('Extra Email validator', () => {
  it('should validate and normalize an email', () => {
    expect(validate(email, 'Test@Example.ORG'))
        .toStrictlyEqual('test@example.org')
  })

  it('should reject a short email', () => {
    expect(() => validate(email, 'a@b'))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error$/m)
            .toHaveProperty('errors', (assert) => assert.toEqual([ {
              message: 'String must have a minimum length of 5',
              path: [],
            } ])),
        )
  })

  it('should reject a long email', () => {
    const localPart = 'a'.repeat(120)
    expect(() => validate(email, `${localPart}@example.com`))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error$/m)
            .toHaveProperty('errors', (assert) => assert.toEqual([ {
              message: 'String must have a maximum length of 128',
              path: [],
            } ])),
        )
  })

  it('should reject an invalid email', () => {
    expect(() => validate(email, 'This is not an email'))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 1 validation error$/m)
            .toHaveProperty('errors', (assert) => assert.toEqual([ {
              message: expect.toMatch(/^String does not match required pattern /),
              path: [],
            } ])),
        )
  })
})
