import type { Validator } from './validation'

/* ========================================================================== *
 * BASIC VALIDATION (ANY, BOOLEANS)                                           *
 * ========================================================================== */

/**
 * The utility `Validator` for `any` type.
 *
 * @public
 */
export const any: Validator<any> = {
  validate(value): value is any {
    return true
  },
}

/**
 * The utility `Validator` for `boolean`s.
 *
 * @public
 */
export const boolean: Validator<boolean> = {
  validate: (value, context): value is boolean => {
    if (typeof value === 'boolean') return true
    context.fail('Value is not a "boolean"')
    return false
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
export function number(constraints?: NumberConstraints): Validator<number> {
  // TODO: implement me!
  void constraints
  return <any> null
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
export function string(constraints?: StringConstraints): Validator<string> {
  // TODO: implement me!
  void constraints
  return <any> null
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
  // TODO: implement me!
  void constant
  return <any> null
}
