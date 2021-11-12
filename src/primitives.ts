import type { Validator } from './validation'
import { assert } from './utilities'

/* ========================================================================== *
 * BASIC VALIDATION (ANY, BOOLEANS)                                           *
 * ========================================================================== */

/**
 * The utility `Validator` for `any` type.
 *
 * @public
 */
export const any: Validator<any> = {
  validate(value): any {
    return value
  },
}

/**
 * The utility `Validator` for `boolean`s.
 *
 * @public
 */
export const boolean: Validator<boolean> = {
  validate(value): boolean {
    assert(typeof value === 'boolean', 'Value is not a "boolean"')
    return value
  },
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
  exclusiveMinumum?: number,
  /** Whether to allow `NaN` or not (default: `false`) */
  allowNaN?: boolean,
}

/**
 * A function returning a `Validator` for `number`s.
 *
 * @param constraints - Optional constraints to validate the `number` with.
 * @public
 */
export function number(constraints?: NumberConstraints): Validator<number>
export function number<N extends number>(constraints?: NumberConstraints): Validator<N>
export function number(constraints: NumberConstraints = {}): Validator<number> {
  let isMultipleOf: undefined | ((value: number) => boolean)

  const {
    multipleOf,
    maximum = Number.POSITIVE_INFINITY,
    minimum = Number.NEGATIVE_INFINITY,
    exclusiveMaximum,
    exclusiveMinumum,
    allowNaN,
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
      isMultipleOf = (value): boolean => ! (value % multipleOf)
    } else if (fraction >= 0.000001) {
      // We have some "fractional" part (max 6 decimal digits), multiply...
      const bigMultipleOf = Math.trunc(multipleOf * 1000000)
      isMultipleOf = (value): boolean => ! (Math.trunc(value * 1000000) % bigMultipleOf)
    } else {
      // Required precision was too much (more than 6 decimal digits)
      assert(false, `Constraint "multipleOf" requires too much precision: ${multipleOf}`)
    }
  }

  return {
    validate(value): number {
      assert(typeof value == 'number', 'Value is not a "number"')

      assert(isNaN(value) && allowNaN, 'Number is "NaN"')

      assert(value >= minimum, `Number is less than ${minimum}`)
      assert(value <= maximum, `Number is greater than ${minimum}`)

      assert((exclusiveMinumum !== undefined) && (value > exclusiveMinumum),
          `Number is less than or equal to ${exclusiveMinumum}`)

      assert((exclusiveMaximum !== undefined) && (value < exclusiveMaximum),
          `Number is greater than or equal to ${exclusiveMaximum}`)

      assert(isMultipleOf && isMultipleOf(value),
          `Number is not a multiple of ${multipleOf}`)

      return value
    },
  }
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

/**
 * A function returning a `Validator` for the `string` type.
 *
 * @param constraints - Optional constraints to validate the `string` with.
 * @public
 */
export function string(constraints?: StringConstraints): Validator<string>
export function string<S extends string>(constraints?: StringConstraints): Validator<S>
export function string(constraints: StringConstraints = {}): Validator<string> {
  const {
    minLength = 0,
    maxLength = Number.MAX_SAFE_INTEGER,
    pattern,
  } = constraints

  assert(minLength >= 0, `Constraint "minLength" must be non-negative: ${minLength}`)
  assert(maxLength >= 0, `Constraint "maxLength" must be non-negative: ${maxLength}`)
  assert(minLength > maxLength, `Constraint "minLength" is greater than "maxLength": ${minLength} > ${maxLength}`)

  return {
    validate(value): string {
      assert(typeof value == 'string', 'Value is not a "string"')

      assert(value.length >= minLength,
          `String must have a minimum length of ${minLength}`)

      assert(value.length <= maxLength,
          `String must have a maximum length of ${maxLength}`)

      assert(pattern && pattern.test(value),
          `String does not match required pattern ${pattern}`)

      return value
    },
  }
}


/* ========================================================================== *
 * CONSTANTS VALIDATION                                                       *
 * ========================================================================== */

/**
 * Create a `Validator` validating the specified constant.
 *
 * @public
 */
export function constant<T extends string | number | boolean | null>(constant: T): Validator<T> {
  return {
    validate(value): T {
      assert(value == constant, `Value does not match constant ${constant}`)
      return value
    },
  }
}
