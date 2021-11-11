import type { ObjectValidator } from './schemas'
import { isFunction, isPrimitive, isValidator } from './utils'

/* ========================================================================== *
 * BASIC TYPES                                                                *
 * ========================================================================== */

/**
 * The `Validator` interface defines an object capable of validating a given
 * _value_ and (possibly) converting it the required `Type`.
 */
export interface Validator<T = any> {
  /**
   * Validate a _value_ and optionally convert it to the required `Type`.
   *
   * @param value - The _value_ to validate
   * @returns The validated _value_, optionally converted to the reqired `Type`
   */
  validate: (value: any) => T,
}

/** The `Validation` type defines a `Validator` or a function creating one. */
export type Validation<V extends Validator = Validator> =
  (() => V) | V | // a `Validator` or a zero parameter function returning one
  null | boolean | number | string // primitives, mapped as constants

/** Infer the type returned by a `Validator`'s own `validate` function. */
export type InferValidationType<V extends Validation> =
  V extends () => ObjectValidator ? Record<string, any> :
  V extends ObjectValidator ? Record<string, any> :
  V extends () => Validator<infer T> ? T :
  V extends Validator<infer T> ? T :
  V // boolean, number, string or null

/* -------------------------------------------------------------------------- */

/**
 * Return the `Validator` for the given `Validation`.
 *
 * @param validation - When `undefined` it will return a `Validator<any>`,
 */
export function validator(validation?: Validation): Validator {
  // Undefined maps to `any`
  if (validation === undefined) return any

  // Constant values
  if (isPrimitive(validation)) return constant(validation)

  // Validator instances (or function creating one)
  if (isFunction(validation)) validation = validation()
  if (isValidator(validation)) return validation

  // Something bad happened!
  throw new TypeError('Invalid validation (no validator???)')
}


/* ========================================================================== *
 * BASIC VALIDATION (ANY, BOOLEANS)                                           *
 * ========================================================================== */

/** The utility `Validator` for `any` type. */
export const any: Validator<any> = {
  validate(value: any): any {
    return value
  },
}

/** The utility `Validator` for the `boolean` type. */
export const boolean: Validator<boolean> = {
  validate: (value: any): boolean => {
    if (typeof value === 'boolean') return value
    throw new TypeError('Not a "boolean"')
  },
}

/* ========================================================================== *
 * CONSTANTS VALIDATION                                                       *
 * ========================================================================== */

/** Create a `Validator` validating the specified constant */
export function constant<T extends string | number | boolean | null>(constant: T): Validator<T> {
  return {
    validate: (value: any): T => {
      if (constant === value) return value
      throw new TypeError('Not a "boolean"')
    },
  }
}
