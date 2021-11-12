import type { ObjectValidator } from './schemas'

/* ========================================================================== *
 * BASIC TYPES                                                                *
 * ========================================================================== */

/**
 * The `Validator` interface defines an object capable of validating a given
 * _value_ and (possibly) converting it the required `Type`.
 *
 * @public
 */
export interface Validator<T = any> {
  /**
   * Validate a _value_ and optionally convert it to the required `Type`.
   *
   * @param value - The _value_ to validate
   */
  validate(value: any): T,
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
 * VALIDATE                                                                   *
 * ========================================================================== */

// import { getValidator } from './utilities'

export function validate<V extends Validation>(validator: V, value: any): InferValidationType<V> {
  // if (getValidator(validator).validate(value)) {
  //   return value
  // } else {
  //   throw new Error('Invalid')
  // }
  // TODO
  void validator, value
  return <any> null
}
