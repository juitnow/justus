import { Branding, Validator } from '../types'
import { assertSchema, assertValidation } from '../errors'
import { makeTupleRestIterable } from './tuple'

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
  /** Whether to allow `NaN` or not (default: `false`) */
  allowNaN?: boolean,
}

/** Constraints to validate a `number` with extra branding information. */
export interface BrandedNumberConstraints<B extends string> extends NumberConstraints {
  /** The _brand_ of the string (will generate a `__brand_${B}` type property */
  brand: B
}

/** A `Validator` validating `number`s. */
export class NumberValidator<N extends number = number> extends Validator<N> {
  #isMultipleOf?: ((value: number) => boolean)

  readonly allowNaN: boolean
  readonly exclusiveMaximum?: number
  readonly exclusiveMinimum?: number
  readonly maximum: number
  readonly minimum: number
  readonly multipleOf?: number

  constructor(constraints: NumberConstraints = {}) {
    super()

    const {
      allowNaN = false,
      exclusiveMaximum,
      exclusiveMinimum,
      maximum = Number.POSITIVE_INFINITY,
      minimum = Number.NEGATIVE_INFINITY,
      multipleOf,
    } = constraints

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

      // Split the multiple of in integer and fraction
      const bigMultipleOf = multipleOf * NumberValidator.PRECISION
      const bigInteger = bigMultipleOf % NumberValidator.PRECISION
      const bigDecimal = bigMultipleOf - Math.trunc(bigMultipleOf)

      if (bigInteger === 0) {
        // Easy case is when we only have to deal with integers...
        this.#isMultipleOf = (value): boolean => ! (value % multipleOf)
      } else if (bigDecimal === 0) {
        // We have some "decimal" part (max 6 decimal digits), multiply...
        this.#isMultipleOf = (value): boolean => ! ((value * NumberValidator.PRECISION) % bigMultipleOf)
      } else {
        // Required precision was too much (more than 6 decimal digits)
        assertSchema(false, `Constraint "multipleOf" (${multipleOf}) requires too much precision`)
      }
    }

    this.allowNaN = allowNaN
    this.exclusiveMaximum = exclusiveMaximum
    this.exclusiveMinimum = exclusiveMinimum
    this.maximum = maximum
    this.minimum = minimum
    this.multipleOf = multipleOf
  }

  validate(value: unknown): N {
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

  static readonly PRECISION = 1000000
}

const anyNumberValidator = new class extends Validator<number> {
  validate(value: unknown): number {
    assertValidation(typeof value == 'number', 'Value is not a "number"')
    assertValidation(! isNaN(value), 'Number is "NaN"')
    return value
  }
}

function _number(): Validator<number>
function _number<N extends number = number>(constraints?: NumberConstraints): NumberValidator<N>
function _number<B extends string>(constraints: BrandedNumberConstraints<B>): NumberValidator<number & Branding<B>>

function _number(constraints?: NumberConstraints): Validator<number> {
  return constraints ? new NumberValidator(constraints) : anyNumberValidator
}

/** Validate `number`s. */
export const number = makeTupleRestIterable(_number)
