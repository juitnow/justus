import { guard, never, number, object, optional, string } from '../src/index.ts'

describe('Type Guard', () => {
  it('should loosely identify valid values', () => {
    const validation = object({
      forbidden: never,
      string: string({ minLength: 1 }),
      number: optional(number),
    })

    const isValid = guard(validation)

    // Wrong type
    expect(isValid('hello')).toBeFalse()
    // Correct with optional properties
    expect(isValid({ string: 'hello' })).toBeTrue()
    expect(isValid({ string: 'hello', number: 123 })).toBeTrue()
    // Correct with *extra* properties
    expect(isValid({ string: 'hello', number: 123, extra: true })).toBeTrue()
    // Forbidden property
    expect(isValid({ string: 'hello', forbidden: 'nope' })).toBeFalse()
  })

  it('should strictly identify valid values', () => {
    const validation = object({
      forbidden: never,
      string: string({ minLength: 1 }),
      number: optional(number),
    })

    const isValid = guard(validation, true)

    // Wrong type
    expect(isValid('hello')).toBeFalse()
    // Correct with optional properties
    expect(isValid({ string: 'hello' })).toBeTrue()
    expect(isValid({ string: 'hello', number: 123 })).toBeTrue()
    // Correct with *extra* properties
    expect(isValid({ string: 'hello', number: 123, extra: true })).toBeFalse()
    // Forbidden property
    expect(isValid({ string: 'hello', forbidden: 'nope' })).toBeFalse()
  })
})
