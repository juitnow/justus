import { Validator } from '../validator'
import { assert, ValidationError } from '../errors'
import { makeTupleRestIterable } from '../utilities'

/**
 * Constraints to validate a `number` with.
 */
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

    assert(maximum >= minimum, `Constraint "minimum" (${minimum}) is greater than "maximum" (${maximum})`)

    if (exclusiveMaximum !== undefined) {
      assert(exclusiveMaximum > minimum,
          `Constraint "exclusiveMaximum" (${exclusiveMaximum}) must be greater than "minimum" (${minimum})`)
    }

    if (exclusiveMinimum !== undefined) {
      assert(maximum > exclusiveMinimum,
          `Constraint "maximum" (${maximum}) must be greater than "exclusiveMinimum" (${exclusiveMinimum})`)
    }

    if ((exclusiveMinimum != undefined) && (exclusiveMaximum !== undefined)) {
      assert(exclusiveMaximum > exclusiveMinimum,
          `Constraint "exclusiveMaximum" (${exclusiveMaximum}) must be greater than "exclusiveMinimum" (${exclusiveMinimum})`)
    }

    if (multipleOf !== undefined) {
      assert(multipleOf > 0, `Constraint "multipleOf" (${multipleOf}) must be greater than zero`)

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
        assert(false, `Constraint "multipleOf" (${multipleOf}) requires too much precision`)
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
    ValidationError.assert(typeof value == 'number', 'Value is not a "number"')

    if (isNaN(value)) {
      ValidationError.assert(this.allowNaN, 'Number is "NaN"')
      return value as N
    }

    ValidationError.assert(value >= this.minimum, `Number is less than ${this.minimum}`)
    ValidationError.assert(value <= this.maximum, `Number is greater than ${this.maximum}`)

    ValidationError.assert((this.exclusiveMinimum == undefined) || (value > this.exclusiveMinimum),
        `Number is less than or equal to ${this.exclusiveMinimum}`)

    ValidationError.assert((this.exclusiveMaximum == undefined) || (value < this.exclusiveMaximum),
        `Number is greater than or equal to ${this.exclusiveMaximum}`)

    ValidationError.assert(this.#isMultipleOf ? this.#isMultipleOf(value) : true,
        `Number is not a multiple of ${this.multipleOf}`)

    return value as N
  }

  static readonly PRECISION = 1000000
}

const anyNumberValidator = new class extends Validator<number> {
  validate(value: unknown): number {
    ValidationError.assert(typeof value == 'number', 'Value is not a "number"')
    ValidationError.assert(! isNaN(value), 'Number is "NaN"')
    return value
  }
}

function _number(): Validator<number>
function _number<N extends number = number>(constraints?: NumberConstraints): NumberValidator<N>

function _number(constraints?: NumberConstraints): Validator<number> {
  return constraints ? new NumberValidator(constraints) : anyNumberValidator
}

export const number = makeTupleRestIterable(_number)
