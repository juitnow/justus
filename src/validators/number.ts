import { assertSchema, assertValidation, ValidationError } from '../errors'
import { AbstractValidator, makeValidatorFactory } from '../types'

import type { Branding, Validator } from '../types'

/* ========================================================================== */

const PRECISION = 6 // our default precision, in decimal digits
const MULTIPLIER = Math.pow(10, PRECISION) // multiplier for precision

function countDecimals(n: number): number {
  // match the parts of the exponential form of the number
  const match = n.toExponential().match(/^\d+(\.\d+)?e([+-]\d+)$/)
  if (! match) throw new RangeError(`Can't calculate digits for number "${n}"`)
  // number of digits in the absolute value, minus whatever is the exp
  const digits = ((match[1] || '.').length - 1) - (parseInt(match[2]))
  return digits < 0 ? 0 : digits
}

/* ========================================================================== */

/** Constraints to validate a `number` with. */
export interface NumberConstraints {
  /** The value for which a `number` must be multiple of for it to be valid */
  multipleOf?: number,
  /** The _inclusive_ maximum value for a valid `number`: `value <= maximum` */
  maximum?: number,
  /** The _inclusive_ minimum value for a valid `number`: `value >= minimum` */
  minimum?: number,
  /** The _exclusive_ maximum value for a valid `number`: `value < exclusiveMaximum` */
  exclusiveMaximum?: number,
  /** The _exclusive_ minimum value for a valid `number`: `value > exclusiveMaximum` */
  exclusiveMinimum?: number,
  /** Allow numbers to be parsed from strings (e.g. `123.456` or `0x0CAFE`, default: `false`) */
  fromString?: boolean,
  /** Whether to allow `NaN` or not (default: `false`) */
  allowNaN?: boolean,
}

/** Constraints to validate a `number` with extra branding information. */
export interface BrandedNumberConstraints<B extends string> extends NumberConstraints {
  /** The _brand_ of the string (will generate a `__brand_${B}` type property */
  brand: B
}

/** A `Validator` validating any `number`. */
export class AnyNumberValidator extends AbstractValidator<number> {
  validate(value: unknown): number {
    assertValidation(typeof value == 'number', 'Value is not a "number"')
    assertValidation(! isNaN(value), 'Number is "NaN"')
    return value
  }
}

/** A `Validator` validating `number`s with constaints. */
export class NumberValidator<N extends number = number> extends AbstractValidator<N, number> {
  #isMultipleOf?: ((value: number) => boolean)

  readonly allowNaN: boolean
  readonly exclusiveMaximum?: number
  readonly exclusiveMinimum?: number
  readonly fromString: boolean
  readonly maximum: number
  readonly minimum: number
  readonly multipleOf?: number
  readonly brand?: string

  constructor(constraints: NumberConstraints = {}) {
    super()

    const {
      allowNaN = false,
      exclusiveMaximum,
      exclusiveMinimum,
      fromString = false,
      maximum = Number.POSITIVE_INFINITY,
      minimum = Number.NEGATIVE_INFINITY,
      multipleOf,
    } = constraints

    if ('brand' in constraints) this.brand = (<any> constraints).brand

    assertSchema(maximum >= minimum, `Constraint "minimum" (${minimum}) is greater than "maximum" (${maximum})`)

    if (exclusiveMaximum !== undefined) {
      assertSchema(exclusiveMaximum > minimum,
          `Constraint "exclusiveMaximum" (${exclusiveMaximum}) must be greater than "minimum" (${minimum})`)
    }

    if (exclusiveMinimum !== undefined) {
      assertSchema(maximum > exclusiveMinimum,
          `Constraint "maximum" (${maximum}) must be greater than "exclusiveMinimum" (${exclusiveMinimum})`)
    }

    if ((exclusiveMinimum != undefined) && (exclusiveMaximum !== undefined)) {
      assertSchema(exclusiveMaximum > exclusiveMinimum,
          `Constraint "exclusiveMaximum" (${exclusiveMaximum}) must be greater than "exclusiveMinimum" (${exclusiveMinimum})`)
    }

    if (multipleOf !== undefined) {
      assertSchema(multipleOf > 0, `Constraint "multipleOf" (${multipleOf}) must be greater than zero`)
      const decimals = countDecimals(multipleOf)

      if (decimals === 0) {
        // Easy case is when we only have to deal with integers...
        this.#isMultipleOf = (value): boolean => ! (value % multipleOf)
      } else if (decimals <= PRECISION) {
        // We have some "decimal" part (max 6 decimal digits), multiply...
        this.#isMultipleOf = (value): boolean => {
          try {
            if (countDecimals(value) > PRECISION) return false
            return ! ((value * MULTIPLIER) % (multipleOf * MULTIPLIER))
          } catch (error: any) {
            throw new ValidationError(error.message)
          }
        }
      } else {
        // Required precision was too much (more than 6 decimal digits)
        assertSchema(false, `Constraint "multipleOf" (${multipleOf}) requires too much precision`)
      }
    }

    this.allowNaN = allowNaN
    this.exclusiveMaximum = exclusiveMaximum
    this.exclusiveMinimum = exclusiveMinimum
    this.fromString = fromString
    this.maximum = maximum
    this.minimum = minimum
    this.multipleOf = multipleOf
  }

  validate(value: unknown): N {
    // Allow parsing from strings
    if ((typeof value == 'string') && (this.fromString)) {
      const parsed = +`${value}`
      assertValidation(! isNaN(parsed), 'Number can not be parsed from string')
      value = parsed
    }

    assertValidation(typeof value == 'number', 'Value is not a "number"')

    if (isNaN(value)) {
      assertValidation(this.allowNaN, 'Number is "NaN"')
      return value as N
    }

    assertValidation(value >= this.minimum, `Number is less than ${this.minimum}`)
    assertValidation(value <= this.maximum, `Number is greater than ${this.maximum}`)

    assertValidation((this.exclusiveMinimum == undefined) || (value > this.exclusiveMinimum),
        `Number is less than or equal to ${this.exclusiveMinimum}`)

    assertValidation((this.exclusiveMaximum == undefined) || (value < this.exclusiveMaximum),
        `Number is greater than or equal to ${this.exclusiveMaximum}`)

    assertValidation(this.#isMultipleOf ? this.#isMultipleOf(value) : true,
        `Number is not a multiple of ${this.multipleOf}`)

    return value as N
  }
}

export function numberFactory(constraints: NumberConstraints): NumberValidator<number>
export function numberFactory<N extends number>(constraints: NumberConstraints): NumberValidator<N>
export function numberFactory<B extends string>(constraints: BrandedNumberConstraints<B>): NumberValidator<number & Branding<B>>
export function numberFactory(constraints: NumberConstraints): Validator<number> {
  return new NumberValidator(constraints)
}

/** Validate `number`s. */
export const number = makeValidatorFactory(new AnyNumberValidator(), numberFactory)
