/* ========================================================================== *
 * EXPORTS                                                                    *
 * ========================================================================== */

// All our types and utilities
export * from './errors'
export * from './schema'
export * from './types'
export * from './utilities'

// Validators
export { any, AnyValidator } from './validators/any'
export { array, arrayOf, ArrayValidator, AnyArrayValidator } from './validators/array'
export { boolean, BooleanValidator } from './validators/boolean'
export { constant, ConstantValidator } from './validators/constant'
export { date, DateValidator } from './validators/date'
export { never, NeverValidator } from './validators/never'
export { AnyNumberValidator, number, NumberValidator } from './validators/number'
export { AnyObjectValidator, object, objectOf, ObjectValidator } from './validators/object'
export { optional, OptionalValidator } from './validators/optional'
export { AnyStringValidator, string, StringValidator } from './validators/string'
export { tuple, TupleValidator } from './validators/tuple'
export { allOf, AllOfValidator, oneOf, OneOfValidator } from './validators/union'
export { url, URLValidator } from './validators/url'

// Validator Types
export type { ArrayConstraints } from './validators/array'
export type { BooleanConstraints } from './validators/boolean'
export type { DateConstraints } from './validators/date'
export type { BrandedNumberConstraints } from './validators/number'
export type { BrandedStringConstraints, StringConstraints } from './validators/string'
export type { TupleMember } from './validators/tuple'
export type { URLConstraints } from './validators/url'

/* ========================================================================== *
 * VALIDATE FUNCTION (our main entry point)                                   *
 * ========================================================================== */

import { defaultValidationOptions } from './types'
import { getValidator } from './utilities'

import type { InferValidation, Validation, ValidationOptions } from './types'

/**
 * Validate a _value_ using the specified `Validation`.
 *
 * By default additional and forbidden properties will _not_ be stripped and
 * reported as an error.
 */
export function validate<V extends Validation>(
    validation: V,
    value: any,
    options?: ValidationOptions,
): InferValidation<V> {
  const opts: ValidationOptions = { ...defaultValidationOptions, ...options }
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
    options?: ValidationOptions,
): InferValidation<V> {
  const opts: ValidationOptions = {
    stripAdditionalProperties: true,
    stripForbiddenProperties: false,
    stripOptionalNulls: true,
    ...options,
  }

  return getValidator(validation).validate(value, opts)
}
