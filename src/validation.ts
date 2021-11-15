import { ObjectValidator } from './objects'
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
  V extends () => ObjectValidator ? Record<string, any> :
  V extends ObjectValidator ? Record<string, any> :
  V extends () => Validator<infer T> ? T :
  V extends Validator<infer T> ? T :
  V // boolean, number, string or null

/* ========================================================================== *
 * VALIDATE                                                                   *
 * ========================================================================== */

export interface ValidationOptions {
  readonly maximumFailures: number,
  readonly stripAdditionalProperties: boolean,
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
    maximumFailures: Number.POSITIVE_INFINITY,
    stripAdditionalProperties: false,
    ...options,
  }

  return getValidator(validator).validate(value, opts)
}
