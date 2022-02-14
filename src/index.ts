/* ========================================================================== *
 * EXPORTS                                                                    *
 * ========================================================================== */

// All our types and utilities
export * from './errors'
export * from './schema'
export * from './types'
export * from './utilities'

// Validators
export { allOf, oneOf, AllOfValidator, OneOfValidator } from './validators/union'
export { any, AnyValidator } from './validators/any'
export { array, arrayOf, AnyArrayValidator, ArrayValidator } from './validators/array'
export { boolean, BooleanValidator } from './validators/boolean'
export { constant, ConstantValidator } from './validators/constant'
export { date, DateValidator } from './validators/date'
export { number, AnyNumberValidator, NumberValidator } from './validators/number'
export { object, AnyObjectValidator, ObjectValidator } from './validators/object'
export { string, AnyStringValidator, StringValidator } from './validators/string'
export { tuple, TupleValidator } from './validators/tuple'
export { url, URLValidator } from './validators/url'

/* ========================================================================== *
 * VALIDATE FUNCTION (our main entry point)                                   *
 * ========================================================================== */

import type { InferValidation, Validation, ValidationOptions } from './types'
import { getValidator } from './utilities'

/** Options for `validate` */
export type ValidateOptions = {
  -readonly [ key in keyof ValidationOptions ]?: ValidationOptions[key] | undefined
}

/**
 * Validate a _value_ using the specified `Validation`.
 *
 * By default additional and forbidden properties will _not_ be stripped and
 * reported as an error.
 */
export function validate<V extends Validation>(
    validation: V,
    value: any,
    options: ValidateOptions = {},
): InferValidation<V> {
  const opts: ValidationOptions = {
    stripAdditionalProperties: false,
    stripForbiddenProperties: false,
    ...options,
  }

  return getValidator(validation).validate(value, opts)
}

/**
 * Validate a _value_ using the specified `Validation`, automatically stripping
 * additional properties (but not forbidden ones).
 */
export function strip<V extends Validation>(
    validation: V,
    value: any,
    options: ValidateOptions = {},
): InferValidation<V> {
  const opts: ValidationOptions = {
    stripAdditionalProperties: true,
    stripForbiddenProperties: false,
    ...options,
  }

  return getValidator(validation).validate(value, opts)
}
