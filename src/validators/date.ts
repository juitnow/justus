import { assertSchema, assertValidation, ValidationError } from '../errors'
import { Validator } from '../types'
import { makeTupleRestIterable } from './tuple'

/**
 * Lifted from AngularJS: matches strings that have the form of a valid
 * RFC 3339 string.
 */
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|(?:(?:\+|-)\d{2}:\d{2}))?)?$/

/**
 * Constraints to validate a `Date` with.
 */
export interface DateConstraints {
  format?: 'iso' | 'timestamp',
  from?: Date,
  until?: Date,
}

export class DateValidator extends Validator<Date> {
  readonly format?: 'iso' | 'timestamp'
  readonly from?: Date
  readonly until?: Date

  constructor(constraints: DateConstraints = {}) {
    super()

    const { format, from, until } = constraints

    if ((from != undefined) && (until !== undefined)) {
      assertSchema(until.getTime() >= from.getTime(),
          `Constraint "until" (${until.toISOString()}) must not be before "from" (${from.toISOString()})`)
    }

    this.format = format
    this.from = from
    this.until = until
  }

  validate(value: unknown): Date {
    let date: Date
    try {
      date = new Date(value as any)
    } catch (error) {
      throw new ValidationError('Value could not be converted to a "Date"')
    }

    if (isNaN(date.getTime())) throw new ValidationError('Invalid date')

    if (this.format === 'iso') {
      assertValidation(typeof value === 'string', 'ISO Date is not a "string"')
      assertValidation(ISO_8601_REGEX.test(value), 'Invalid format for ISO Date')
    } else if (this.format === 'timestamp') {
      assertValidation(typeof value === 'number', 'Timestamp is not a "number"')
    }

    if (this.from) {
      assertValidation(this.from.getTime() <= date.getTime(), `Date is before ${this.from.toISOString()}`)
    }

    if (this.until) {
      assertValidation(this.until.getTime() >= date.getTime(), `Date is after ${this.until.toISOString()}`)
    }

    return date
  }
}

const anyDateValidator = new DateValidator()

function _date(): DateValidator
function _date(constraints: DateConstraints): DateValidator

function _date(constraints?: DateConstraints): DateValidator {
  return constraints ? new DateValidator(constraints) : anyDateValidator
}

export const date = makeTupleRestIterable(_date)
