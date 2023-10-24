import { expect } from 'chai'

import { date, validate, ValidationError } from '../src'

describe('Date validator', () => {
  it('should validate a simple date', () => {
    expect(validate(date, 0).getTime()).to.eql(0)
    expect(validate(date, '1970-01-01T00:00:00.000Z').getTime()).to.eql(0)
    expect(validate(date, 'Thu, 01 Jan 1970 00:00:00 GMT').getTime()).to.eql(0)
  })

  it('should validate a Date instance', () => {
    const now = new Date()
    expect(validate(date, now).getTime()).to.eql(now.getTime())
  })

  it('should validate an ISO date', () => {
    const validator = date({ format: 'iso' })

    expect(validate(validator, '1970-01-01T00:00:00.000Z').getTime()).to.eql(0)

    expect(() => validate(validator, 'Thu, 01 Jan 1970 00:00:00 GMT'))
        .to.throw(ValidationError, /^Found 1 validation error/)
        .with.property('errors').to.eql([ {
          path: [], message: 'Invalid format for ISO Date',
        } ])
  })

  it('should validate a timestamp', () => {
    const validator = date({ format: 'timestamp' })

    expect(validate(validator, 0).getTime()).to.eql(0)

    expect(() => validate(validator, 'Thu, 01 Jan 1970 00:00:00 GMT'))
        .to.throw(ValidationError, /^Found 1 validation error/)
        .with.property('errors').to.eql([ {
          path: [], message: 'Timestamp is not a "number"',
        } ])
  })

  it('should validate a date within a range', () => {
    const v1 = date({ from: new Date(2000), until: new Date(3000) })

    expect(validate(v1, 2000).getTime()).to.eql(2000)
    expect(validate(v1, 3000).getTime()).to.eql(3000)

    expect(() => validate(v1, 1999))
        .to.throw(ValidationError, /^Found 1 validation error/)
        .with.property('errors').to.eql([ {
          path: [], message: 'Date is before 1970-01-01T00:00:02.000Z',
        } ])

    expect(() => validate(v1, 3001))
        .to.throw(ValidationError, /^Found 1 validation error/)
        .with.property('errors').to.eql([ {
          path: [], message: 'Date is after 1970-01-01T00:00:03.000Z',
        } ])


    const v2 = date({ from: new Date(2000), until: new Date(2000) })

    expect(validate(v2, 2000).getTime()).to.eql(2000)

    expect(() => validate(v2, 1999))
        .to.throw(ValidationError, /^Found 1 validation error/)
        .with.property('errors').to.eql([ {
          path: [], message: 'Date is before 1970-01-01T00:00:02.000Z',
        } ])

    expect(() => validate(v2, 2001))
        .to.throw(ValidationError, /^Found 1 validation error/)
        .with.property('errors').to.eql([ {
          path: [], message: 'Date is after 1970-01-01T00:00:02.000Z',
        } ])

    expect(() => date({ from: new Date(100), until: new Date(99) }))
        .to.throw(TypeError, 'Constraint "until" (1970-01-01T00:00:00.099Z) must not be before "from" (1970-01-01T00:00:00.100Z)')
  })

  it('should consider edge cases', () => {
    expect(() => validate(date, Symbol()))
        .to.throw(ValidationError, /^Found 1 validation error/)
        .with.property('errors').to.eql([ {
          path: [], message: 'Value could not be converted to a "Date"',
        } ])

    expect(() => validate(date, Number.POSITIVE_INFINITY))
        .to.throw(ValidationError, /^Found 1 validation error/)
        .with.property('errors').to.eql([ {
          path: [], message: 'Invalid date',
        } ])
  })
})
