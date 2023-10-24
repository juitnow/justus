import { arrayOf, date, object, tuple, validate } from '../src'

describe('Type conversion', () => {
  it('should convert types in arrays', () => {
    const src = [ 0 ]
    const tgt = validate(arrayOf(date), src)

    expect(src).not.toStrictlyEqual(tgt)
    expect(src).toEqual([ 0 ])

    expect(tgt).toBeA('array').toHaveLength(1)
    expect(tgt[0]).toBeInstanceOf(Date)
    expect(tgt[0].getTime()).toStrictlyEqual(0)
  })

  it('should convert types in tuples', () => {
    const src = [ 0 ]
    const tgt = validate(tuple([ date ]), src)

    expect(src).not.toStrictlyEqual(tgt)
    expect(src).toEqual([ 0 ])

    expect(tgt).toBeA('array').toHaveLength(1)
    expect(tgt[0]).toBeInstanceOf(Date)
    expect(tgt[0].getTime()).toStrictlyEqual(0)
  })

  it('should convert types in objects', () => {
    const src = { foo: 0 }
    const tgt = validate(object({ foo: date }), src)

    expect(src).not.toStrictlyEqual(tgt)
    expect(src).toEqual({ foo: 0 })

    expect(tgt).toBeA('object')
    expect(tgt.foo).toBeInstanceOf(Date)
    expect(tgt.foo.getTime()).toStrictlyEqual(0)
  })
})
