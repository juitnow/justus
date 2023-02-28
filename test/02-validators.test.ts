import { expect } from 'chai'

import { AbstractValidator, any, ConstantValidator, getValidator, ObjectValidator, TupleValidator } from '../src'

import type { Schema } from '../src'

describe('Validators', () => {
  const schemaValidator = Symbol.for('justus.validator')
  const restValidator = Symbol.for('justus.validator')

  const fakeValidator = new class extends AbstractValidator {
    validate(): never {
      throw new Error('Method not implemented.')
    }
  }

  it('null', () => {
    expect(getValidator(null))
        .to.be.instanceOf(ConstantValidator)
        .with.property('constant').to.be.null
  })

  it('validators', () => {
    expect(getValidator(any)).to.equal(any)
    expect(getValidator(fakeValidator)).to.equal(fakeValidator)
  })

  it('primitives', () => {
    expect(getValidator(true))
        .to.be.instanceOf(ConstantValidator)
        .with.property('constant').to.be.true

    expect(getValidator(12345))
        .to.be.instanceOf(ConstantValidator)
        .with.property('constant').to.equal(12345)

    expect(getValidator('Hello, world!'))
        .to.be.instanceOf(ConstantValidator)
        .with.property('constant').to.equal('Hello, world!')
  })

  it('objects', () => {
    const objectValidator = getValidator({ foo: 'bar' })
    expect(objectValidator)
        .to.be.instanceOf(ObjectValidator)
        .with.property('schema').to.eql({ foo: 'bar' })

    expect(getValidator({ [schemaValidator]: objectValidator } as Schema))
        .to.equal(objectValidator)
  })

  it('tuples', () => {
    expect(getValidator([ 1, 'foo' ]))
        .to.be.instanceOf(TupleValidator)
        .with.property('tuple').to.eql([ 1, 'foo' ])
  })

  it('others (error)', () => {
    expect(() => getValidator(Symbol('foo') as any))
        .to.throw(TypeError, 'Invalid validation (type=symbol)')
  })

  it('validator iterator (tuple rest parameters)', () => {
    const array = [ ...fakeValidator ]
    expect(array).to.have.length(1)
    expect(array[0]).to.eql({
      [restValidator]: fakeValidator,
    })
  })
})
