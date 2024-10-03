import { assertSchema, assertValidation, ValidationError } from '../errors'
import { AbstractValidator, makeValidatorFactory } from '../types'

/** Lifted from AngularJS: matches a valid RFC 3339 string. */
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|(?:(?:\+|-)\d{2}:\d{2}))?)?$/

/** Constraints to validate a `Date` with. */
export interface DateConstraints {
  /** The format for dates, an _ISO date_ (RFC 3339) or a numeric timestamp */
  format?: 'iso' | 'timestamp',
  /** The earliest value a date can have */
  from?: Date,
  /** The latest value a date can have */
  until?: Date,
}

/** A `Validator` validating dates and converting them to `Date` instances. */
export class DateValidator extends AbstractValidator<Date, Date | string | number> {
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
    const date =
        value instanceof Date ? new Date(value.getTime()) :
        typeof value === 'string' ? new Date(value) :
        typeof value === 'number' ? new Date(value) :
        undefined
    assertValidation(!! date, 'Value could not be converted to a "Date"')

    if (isNaN(date.getTime())) throw new ValidationError('Invalid date')

    if (!(value instanceof Date)) {
      if (this.format === 'iso') {
        assertValidation(typeof value === 'string', 'ISO Date is not a "string"')
        assertValidation(ISO_8601_REGEX.test(value), 'Invalid format for ISO Date')
      } else if (this.format === 'timestamp') {
        assertValidation(typeof value === 'number', 'Timestamp is not a "number"')
      }
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

export function dateValidatorFactory(constraints: DateConstraints): DateValidator {
  return new DateValidator(constraints)
}

/** Validate dates and convert them to `Date` instances. */
export const date = makeValidatorFactory(new DateValidator(), dateValidatorFactory)
