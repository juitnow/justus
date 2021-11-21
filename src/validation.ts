// import { ObjectValidator } from './objects'
import { Validator } from './validator'
import { getValidator } from './utilities'

/* ========================================================================== *
 * BASIC TYPES                                                                *
 * ========================================================================== */

/** The `Validation` type defines a `Validator` or a function creating one. */
export type Validation<V extends Validator = Validator> =
  (() => V) | V | // a `Validator` or a zero parameter function returning one
  null | boolean | number | string // primitives, mapped as constants

/** Infer the type returned by a `Validator`'s own `validate` function. */
export type InferValidationType<V extends Validation> =
  // If this is a function, let's consider up to 10 overloads
  V extends {
    (...args: infer A0): Validator<infer R0>;
    (...args: infer A1): Validator<infer R1>;
    (...args: infer A2): Validator<infer R2>;
    (...args: infer A3): Validator<infer R3>;
    (...args: infer A4): Validator<infer R4>;
    (...args: infer A5): Validator<infer R5>;
    (...args: infer A6): Validator<infer R6>;
    (...args: infer A7): Validator<infer R7>;
    (...args: infer A8): Validator<infer R8>;
    (...args: infer A9): Validator<infer R9>;
  } ? // Consider only the overload with ZERO parameters
    A0 extends [] ? R0 :
    A1 extends [] ? R1 :
    A2 extends [] ? R2 :
    A3 extends [] ? R3 :
    A4 extends [] ? R4 :
    A5 extends [] ? R5 :
    A6 extends [] ? R6 :
    A7 extends [] ? R7 :
    A8 extends [] ? R8 :
    A9 extends [] ? R9 :
    never :
  // All the rest is normal stuff...
  V extends Validator<infer T> ? T :
  V // boolean, number, string or null

/* ========================================================================== *
 * VALIDATE                                                                   *
 * ========================================================================== */

export interface ValidationOptions {
  readonly stripAdditionalProperties: boolean,
  readonly stripForbiddenProperties: boolean,
}

type PartialValidationOptions = {
  -readonly [ key in keyof ValidationOptions ]?: ValidationOptions[key] | undefined
}

export function validate<V extends Validation>(
    validator: V,
    value: any,
    options: PartialValidationOptions = {},
): InferValidationType<V> {
  const opts: ValidationOptions = {
    stripAdditionalProperties: false,
    stripForbiddenProperties: false,
    ...options,
  }

  return getValidator(validator).validate(value, opts)
}
