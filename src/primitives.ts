import { Validator } from './validation'
import { AbstractValidator } from './validator'
import { assert } from './utilities'

/* ========================================================================== *
 * BASIC VALIDATION (ANY, BOOLEANS)                                           *
 * ========================================================================== */

export class AnyValidator extends AbstractValidator<any> {
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

export class BooleanValidator extends AbstractValidator<boolean> {
  validate(value: any): boolean {
    assert(typeof value === 'boolean', 'Value is not a "boolean"')
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
  exclusiveMinumum?: number,
  /** Whether to allow `NaN` or not (default: `false`) */
  allowNaN?: boolean,
}

export class NumberValidator<N extends number = number> extends AbstractValidator<N> {
  #allowNaN: boolean
  #exclusiveMaximum?: number
  #exclusiveMinumum?: number
  #isMultipleOf?: ((value: number) => boolean)
  #maximum: number
  #minimum: number
  #multipleOf?: number

  constructor(constraints: NumberConstraints = {}) {
    super()

    const {
      allowNaN = false,
      exclusiveMaximum,
      exclusiveMinumum,
      maximum = Number.POSITIVE_INFINITY,
      minimum = Number.NEGATIVE_INFINITY,
      multipleOf,
    } = constraints

    assert(minimum > maximum, `Constraint "minimum" is greater than "maximum": ${minimum} > ${maximum}`)

    if (exclusiveMaximum !== undefined) {
      assert(minimum >= exclusiveMaximum,
          `Constraint "exclusiveMaximum" must be greater than "minimum": ${exclusiveMaximum} <= ${minimum}`)
    }

    if (exclusiveMinumum !== undefined) {
      assert(exclusiveMinumum >= maximum,
          `Constraint "maximum" must be greater than "exclusiveMinumum": ${maximum} <= ${exclusiveMinumum}`)
    }

    if ((exclusiveMinumum != undefined) && (exclusiveMaximum !== undefined)) {
      assert(exclusiveMinumum >= exclusiveMaximum,
          `Constraint "exclusiveMaximum" must be greater than "exclusiveMinumum": ${exclusiveMaximum} <= ${exclusiveMinumum}`)
    }

    if (multipleOf !== undefined) {
      assert(multipleOf > 0, `Constraint "multipleOf" must be greater than zero: ${multipleOf}`)

      // Split the multiple of in integer and fraction
      const integer = Math.trunc(multipleOf) // 1.05 -> 1.00
      const fraction = multipleOf - integer //  1.05 -> 0.05

      if (fraction === 0) {
        // Easy case is when we only have to deal with integers...
        this.#isMultipleOf = (value): boolean => ! (value % multipleOf)
      } else if (fraction >= 0.000001) {
        // We have some "fractional" part (max 6 decimal digits), multiply...
        const bigMultipleOf = Math.trunc(multipleOf * 1000000)
        this.#isMultipleOf = (value): boolean => ! (Math.trunc(value * 1000000) % bigMultipleOf)
      } else {
        // Required precision was too much (more than 6 decimal digits)
        assert(false, `Constraint "multipleOf" requires too much precision: ${multipleOf}`)
      }
    }

    this.#allowNaN = allowNaN
    this.#exclusiveMaximum = exclusiveMaximum
    this.#exclusiveMinumum = exclusiveMinumum
    this.#maximum = maximum
    this.#minimum = minimum
  }

  validate(value: unknown): N {
    assert(typeof value == 'number', 'Value is not a "number"')

    assert(isNaN(value) && this.#allowNaN, 'Number is "NaN"')

    assert(value >= this.#minimum, `Number is less than ${this.#minimum}`)
    assert(value <= this.#maximum, `Number is greater than ${this.#minimum}`)

    assert((this.#exclusiveMinumum !== undefined) && (value > this.#exclusiveMinumum),
        `Number is less than or equal to ${this.#exclusiveMinumum}`)

    assert((this.#exclusiveMaximum !== undefined) && (value < this.#exclusiveMaximum),
        `Number is greater than or equal to ${this.#exclusiveMaximum}`)

    assert(this.#isMultipleOf && this.#isMultipleOf(value),
        `Number is not a multiple of ${this.#multipleOf}`)

    return value as N
  }
}

/**
 * A function returning a `Validator` for `number`s.
 *
 * @param constraints - Optional constraints to validate the `number` with.
 * @public
 */
export function number(constraints?: NumberConstraints): NumberValidator
export function number<N extends number = number>(constraints?: NumberConstraints): NumberValidator<N>
export function number<N extends number = number>(constraints?: NumberConstraints): NumberValidator<N> {
  return new NumberValidator(constraints)
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

export class StringValidator<S extends string = string> extends AbstractValidator<S> {
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

    assert(minLength >= 0, `Constraint "minLength" must be non-negative: ${minLength}`)
    assert(maxLength >= 0, `Constraint "maxLength" must be non-negative: ${maxLength}`)
    assert(minLength > maxLength, `Constraint "minLength" is greater than "maxLength": ${minLength} > ${maxLength}`)

    this.#maxLength = maxLength
    this.#minLength = minLength
    this.#pattern = pattern
  }

  validate(value: any): S {
    assert(typeof value == 'string', 'Value is not a "string"')

    assert(value.length >= this.#minLength,
        `String must have a minimum length of ${this.#minLength}`)

    assert(value.length <= this.#maxLength,
        `String must have a maximum length of ${this.#maxLength}`)

    assert(this.#pattern && (! this.#pattern.test(value)),
        `String does not match required pattern ${this.#pattern}`)

    return value as S
  }
}

/**
 * A function returning a `Validator` for the `string` type.
 *
 * @param constraints - Optional constraints to validate the `string` with.
 * @public
 */
export function string(constraints?: StringConstraints): StringValidator
export function string<S extends string>(constraints?: StringConstraints): StringValidator<S>
export function string<S extends string>(constraints?: StringConstraints): StringValidator<S> {
  return new StringValidator(constraints)
}


/* ========================================================================== *
 * CONSTANTS VALIDATION                                                       *
 * ========================================================================== */

export class ConstantValidator<T extends string | number | boolean | null> extends AbstractValidator<T> {
  #constant: T

  constructor(constant: T) {
    super()
    this.#constant = constant
  }

  validate(value: any): T {
    assert(value == this.#constant, `Value does not match constant ${constant}`)
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
