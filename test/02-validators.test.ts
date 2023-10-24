import { AbstractValidator, any, ConstantValidator, getValidator, ObjectValidator, TupleValidator } from '../src'

import type { Schema } from '../src'

describe('Validators', () => {
  const fakeValidator = new class extends AbstractValidator<never, never> {
    validate(): never {
      throw new Error('Method not implemented.')
    }
  }

  it('null', () => {
    expect(getValidator(null))
        .toBeInstanceOf(ConstantValidator)
        .toHaveProperty('constant', expect.toBeNull())
  })

  it('validators', () => {
    expect(getValidator(any)).toStrictlyEqual(any)
    expect(getValidator(fakeValidator)).toStrictlyEqual(fakeValidator)
  })

  it('primitives', () => {
    expect(getValidator(true))
        .toBeInstanceOf(ConstantValidator)
        .toHaveProperty('constant', expect.toBeTrue())

    expect(getValidator(12345))
        .toBeInstanceOf(ConstantValidator)
        .toHaveProperty('constant', expect.toStrictlyEqual(12345))

    expect(getValidator('Hello, world!'))
        .toBeInstanceOf(ConstantValidator)
        .toHaveProperty('constant', expect.toStrictlyEqual('Hello, world!'))
  })

  it('objects', () => {
    const objectValidator = getValidator({ foo: 'bar' })
    expect(objectValidator)
        .toBeInstanceOf(ObjectValidator)
        .toHaveProperty('schema', expect.toEqual({ foo: 'bar' }))

    expect(getValidator({ [Symbol.justusValidator]: objectValidator } as Schema))
        .toStrictlyEqual(objectValidator)
  })

  it('tuples', () => {
    expect(getValidator([ 1, 'foo' ]))
        .toBeInstanceOf(TupleValidator)
        .toHaveProperty('tuple', expect.toEqual([ 1, 'foo' ]))
  })

  it('others (error)', () => {
    expect(() => getValidator(Symbol('foo') as any))
        .toThrowError(TypeError, 'Invalid validation (type=symbol)')
  })

  it('validator iterator (tuple rest parameters)', () => {
    const array = [ ...fakeValidator ]
    expect(array).toEqual([ {
      [Symbol.justusRestValidator]: fakeValidator,
    } ])
  })
})
