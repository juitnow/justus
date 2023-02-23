/* ========================================================================== *
 * EXPORTS                                                                    *
 * ========================================================================== */

// All our types and utilities
export * from './errors'
export * from './schema'
export * from './types'
export * from './utilities'
export { any, AnyValidator } from './validators/any'
export { AnyArrayValidator, array, ArrayConstraints, arrayOf, ArrayValidator, _array } from './validators/array'
export { boolean, BooleanConstraints, BooleanValidator, _boolean } from './validators/boolean'
export { constant, ConstantValidator } from './validators/constant'
export { date, DateConstraints, DateValidator, _date } from './validators/date'
export { never, NeverValidator } from './validators/never'
export { AnyNumberValidator, BrandedNumberConstraints, number, NumberConstraints, NumberValidator, _number } from './validators/number'
export { AnyObjectValidator, object, objectOf, ObjectValidator, _object } from './validators/object'
export { optional, OptionalValidator } from './validators/optional'
export { AnyStringValidator, BrandedStringConstraints, string, StringConstraints, StringValidator, _string } from './validators/string'
export { tuple, TupleMember, TupleValidator } from './validators/tuple'
// Validators
export { allOf, AllOfArguments, AllOfValidator, InferAllOfValidationType, InferOneOfValidationType, oneOf, OneOfArguments, OneOfValidator } from './validators/union'
export { url, URLConstraints, URLValidator, _url } from './validators/url'


/* ========================================================================== *
 * VALIDATE FUNCTION (our main entry point)                                   *
 * ========================================================================== */

import { getValidator } from './utilities'
import { defaultValidationOptions } from './types'

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
