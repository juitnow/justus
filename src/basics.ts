import type { ObjectValidator } from './schemas'
import { any, constant } from './primitives'

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

/* ========================================================================== *
 * UTILITY FUNCTIONS                                                          *
 * ========================================================================== */

/**
 * Return the `Validator` for the given `Validation`.
 *
 * @param validation - When `undefined` it will return a `Validator<any>`,
 */
export function getValidator(validation?: Validation): Validator {
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

export function isPrimitive(what: any): what is boolean | string | number | null {
  if (what === null) return true
  switch (typeof what) {
    case 'boolean':
    case 'string':
    case 'number':
      return true
    default:
      return false
  }
}

export function isFunction(what: any): what is Function {
  return typeof what === 'function'
}

export function isValidator(what: any): what is Validator {
  return what &&
    (typeof what === 'object') &&
    ('validate' in what) &&
    (typeof what.validate === 'function')
}