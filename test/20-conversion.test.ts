import { arrayOf, date, object, tuple, validate } from '../src/index'
import { expect } from 'chai'

describe('Type conversion', () => {
  it('should convert types in arrays', () => {
    const src = [ 0 ]
    const tgt = validate(arrayOf(date), src)

    expect(src).not.to.equal(tgt)
    expect(src).to.eql([ 0 ])

    expect(tgt).to.be.an('array').with.length(1)
    expect(tgt[0]).to.be.instanceOf(Date)
    expect(tgt[0].getTime()).to.equal(0)
  })

  it('should convert types in tuples', () => {
    const src = [ 0 ]
    const tgt = validate(tuple([ date ]), src)

    expect(src).not.to.equal(tgt)
    expect(src).to.eql([ 0 ])

    expect(tgt).to.be.an('array').with.length(1)
    expect(tgt[0]).to.be.instanceOf(Date)
    expect(tgt[0].getTime()).to.equal(0)
  })

  it('should convert types in objects', () => {
    const src = { foo: 0 }
    const tgt = validate(object({ foo: date }), src)

    expect(src).not.to.equal(tgt)
    expect(src).to.eql({ foo: 0 })

    expect(tgt).to.be.an('object')
    expect(tgt.foo).to.be.instanceOf(Date)
    expect(tgt.foo.getTime()).to.equal(0)
  })
})
