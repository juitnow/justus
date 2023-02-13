/* ========================================================================== *
 * EXPORTS                                                                    *
 * ========================================================================== */

// All our types and utilities
export * from './errors'
export * from './schema'
export * from './types'
export * from './utilities'

// Validators
export { allOf, oneOf, AllOfValidator, InferAllOfValidationType, InferOneOfValidationType, OneOfValidator, UnionArguments } from './validators/union'
export { any, AnyValidator } from './validators/any'
export { _array, array, arrayOf, AnyArrayValidator, ArrayConstraints, ArrayValidator } from './validators/array'
export { _boolean, boolean, BooleanConstraints, BooleanValidator } from './validators/boolean'
export { constant, ConstantValidator } from './validators/constant'
export { _date, date, DateConstraints, DateValidator } from './validators/date'
export { never, NeverValidator } from './validators/never'
export { _number, number, AnyNumberValidator, BrandedNumberConstraints, NumberConstraints, NumberValidator } from './validators/number'
export { _object, object, AnyObjectValidator, ObjectValidator } from './validators/object'
export { optional, OptionalValidator } from './validators/optional'
export { _string, string, AnyStringValidator, BrandedStringConstraints, StringConstraints, StringValidator } from './validators/string'
export { tuple, TupleMember, TupleValidator } from './validators/tuple'
export { _url, url, URLConstraints, URLValidator } from './validators/url'

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
    stripOptionalNulls: false,
    ...options,
  }

  return getValidator(validation).validate(value, opts)
}

/**
 * Validate a _value_ using the specified `Validation`, automatically stripping
 * additional properties and optional `null`s (but not forbidden ones).
 *
 * This is equivalent to:
 *
 * ```
 * validate(validation, value, {
 *   stripAdditionalProperties: true,
 *   stripForbiddenProperties: false,
 *   stripOptionalNulls: true,
 * })
 * ```
 */
export function strip<V extends Validation>(
    validation: V,
    value: any,
    options: ValidateOptions = {},
): InferValidation<V> {
  const opts: ValidationOptions = {
    stripAdditionalProperties: true,
    stripForbiddenProperties: false,
    stripOptionalNulls: true,
    ...options,
  }

  return getValidator(validation).validate(value, opts)
}
