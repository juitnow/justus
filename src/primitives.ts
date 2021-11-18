import { Validator } from './validator'
import { ValidationError, assert } from './errors'
import { TupleRest } from './tuples'
import { tupleRest } from './symbols'

/* ========================================================================== *
 * BASIC VALIDATION (ANY, BOOLEANS)                                           *
 * ========================================================================== */

export class AnyValidator extends Validator<any> {
  validate(value: any): any {
    return value
  }
}

/**
 * The utility `Validator` for `any` type.
 *
 * @public
 */
export const any = new AnyValidator()

export class BooleanValidator extends Validator<boolean> {
  validate(value: any): boolean {
    ValidationError.assert(typeof value === 'boolean', 'Value is not a "boolean"')
    return value
  }
}

/**
 * The utility `Validator` for `boolean`s.
 *
 * @public
 */
export const boolean = new BooleanValidator()


/* ========================================================================== *
 * CONSTANTS VALIDATION                                                       *
 * ========================================================================== */

export class ConstantValidator<T extends string | number | boolean | null> extends Validator<T> {
  #constant: T

  constructor(constant: T) {
    super()
    this.#constant = constant
  }

  validate(value: any): T {
    ValidationError.assert(value === this.#constant, `Value does not match constant "${this.#constant}"`)
    return value
  }
}

/**
 * Create a `Validator` validating the specified constant.
 *
 * @public
 */
export function constant<T extends string | number | boolean | null>(constant: T): Validator<T> {
  return new ConstantValidator(constant)
}


/* ========================================================================== *
 * BRANDED NUMBERS VALIDATION                                                 *
 * ========================================================================== */

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
  #allowNaN: boolean
  #exclusiveMaximum?: number
  #exclusiveMinimum?: number
  #isMultipleOf?: ((value: number) => boolean)
  #maximum: number
  #minimum: number
  #multipleOf?: number

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

    this.#allowNaN = allowNaN
    this.#exclusiveMaximum = exclusiveMaximum
    this.#exclusiveMinimum = exclusiveMinimum
    this.#maximum = maximum
    this.#minimum = minimum
    this.#multipleOf = multipleOf
  }

  validate(value: unknown): N {
    ValidationError.assert(typeof value == 'number', 'Value is not a "number"')

    if (isNaN(value)) {
      ValidationError.assert(this.#allowNaN, 'Number is "NaN"')
      return value as N
    }

    ValidationError.assert(value >= this.#minimum, `Number is less than ${this.#minimum}`)
    ValidationError.assert(value <= this.#maximum, `Number is greater than ${this.#maximum}`)

    ValidationError.assert((this.#exclusiveMinimum == undefined) || (value > this.#exclusiveMinimum),
        `Number is less than or equal to ${this.#exclusiveMinimum}`)

    ValidationError.assert((this.#exclusiveMaximum == undefined) || (value < this.#exclusiveMaximum),
        `Number is greater than or equal to ${this.#exclusiveMaximum}`)

    ValidationError.assert(this.#isMultipleOf ? this.#isMultipleOf(value) : true,
        `Number is not a multiple of ${this.#multipleOf}`)

    return value as N
  }

  static readonly PRECISION = 1000000
}

const numberValidator = new class extends Validator<number> {
  validate(value: unknown): number {
    ValidationError.assert(typeof value == 'number', 'Value is not a "number"')
    ValidationError.assert(! isNaN(value), 'Number is "NaN"')
    return value
  }
}

/**
 * A function returning a `Validator` for `number`s.
 *
 * @param constraints - Optional constraints to validate the `number` with.
 * @public
 */
function _number(): Validator<number>
function _number(constraints: NumberConstraints): NumberValidator
function _number<N extends number = number>(constraints?: NumberConstraints): NumberValidator<N>

function _number(constraints?: NumberConstraints): Validator<number> {
  return constraints ? new NumberValidator(constraints) : numberValidator
}

export const number = _number as typeof _number & Iterable<TupleRest<Validator<number>>>

number[Symbol.iterator] = function* (): Generator<TupleRest<Validator<number>>> {
  yield { [tupleRest]: numberValidator }
}

/* ========================================================================== *
 * BRANDED STRINGS VALIDATION                                                 *
 * ========================================================================== */

/** Constraints to validate a `string` with. */
export interface StringConstraints {
  /** The _maximum_ length of a valid `string`: `value.length <= maxLength` */
  maxLength?: number,
  /** The _minimum_ length of a valid `string`: `value.length >= minLength` */
  minLength?: number,
  /** A `RegExp` enforcing a particular pattern for a valid `string`: `pattern.test(value)` */
  pattern?: RegExp,
}

export class StringValidator<S extends string = string> extends Validator<S> {
  #maxLength: number
  #minLength: number
  #pattern?: RegExp

  constructor(constraints: StringConstraints = {}) {
    super()

    const {
      minLength = 0,
      maxLength = Number.MAX_SAFE_INTEGER,
      pattern,
    } = constraints

    assert(minLength >= 0, `Constraint "minLength" (${minLength}) must be non-negative`)
    assert(maxLength >= 0, `Constraint "maxLength" (${maxLength}) must be non-negative`)
    assert(minLength <= maxLength, `Constraint "minLength" (${minLength}) is greater than "maxLength" (${maxLength})`)

    this.#maxLength = maxLength
    this.#minLength = minLength
    this.#pattern = pattern
  }

  validate(value: any): S {
    ValidationError.assert(typeof value == 'string', 'Value is not a "string"')

    ValidationError.assert(value.length >= this.#minLength,
        `String must have a minimum length of ${this.#minLength}`)

    ValidationError.assert(value.length <= this.#maxLength,
        `String must have a maximum length of ${this.#maxLength}`)

    ValidationError.assert(this.#pattern ? this.#pattern.test(value) : true,
        `String does not match required pattern ${this.#pattern}`)

    return value as S
  }
}

const stringValidator = new class extends Validator<string> {
  validate(value: unknown): string {
    ValidationError.assert(typeof value == 'string', 'Value is not a "string"')
    return value
  }
}

/**
 * A function returning a `Validator` for the `string` type.
 *
 * @param constraints - Optional constraints to validate the `string` with.
 * @public
 */
function _string(): Validator<string>
function _string(constraints: StringConstraints): StringValidator
function _string<S extends string>(constraints?: StringConstraints): StringValidator<S>

function _string(constraints?: StringConstraints): Validator<string> {
  return constraints ? new StringValidator(constraints) : stringValidator
}

export const string = _string as typeof _string & Iterable<TupleRest<Validator<string>>>

string[Symbol.iterator] = function* (): Generator<TupleRest<Validator<string>>> {
  yield { [tupleRest]: stringValidator }
}
