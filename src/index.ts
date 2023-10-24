/* ========================================================================== *
 * EXPORTS                                                                    *
 * ========================================================================== */

// All our types and utilities
export * from './errors'
export * from './schema'
export * from './types'
export * from './utilities'

// Validators
export { AnyValidator, any } from './validators/any'
export { AnyArrayValidator, ArrayValidator, array, arrayOf } from './validators/array'
export { BooleanValidator, boolean } from './validators/boolean'
export { ConstantValidator, constant } from './validators/constant'
export { DateValidator, date } from './validators/date'
export { NeverValidator, never } from './validators/never'
export { AnyNumberValidator, NumberValidator, number } from './validators/number'
export { AnyObjectValidator, ObjectValidator, object, objectOf } from './validators/object'
export { OptionalValidator, optional } from './validators/optional'
export { AnyStringValidator, StringValidator, string } from './validators/string'
export { TupleValidator, tuple } from './validators/tuple'
export { AllOfValidator, OneOfValidator, allOf, oneOf } from './validators/union'

// Validator Types
export type { ArrayConstraints, arrayFactory } from './validators/array'
export type { BooleanConstraints, booleanFactory } from './validators/boolean'
export type { DateConstraints, dateFactory } from './validators/date'
export type { BrandedNumberConstraints, numberFactory } from './validators/number'
export type { objectFactory } from './validators/object'
export type { BrandedStringConstraints, StringConstraints, stringFactory } from './validators/string'
export type { TupleMember } from './validators/tuple'

/* ========================================================================== *
 * VALIDATE FUNCTION (our main entry point)                                   *
 * ========================================================================== */

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
  const opts: ValidationOptions = { ...options }
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

/**
 * Validate a _value_ using the specified `Validation`, automatically stripping
 * additional properties and optional `null`s (but not forbidden ones), and
 * treating all properties as optional.
 *
 * This is equivalent to setting the `partialValidation` option to `true` in
 * `validate(...)`, but this function correctly represents the returned type as
 * a `Partial<...>` type.
 */
export function partial<V extends Validation>(
    validation: V,
    value: any,
    options?: ValidationOptions,
): Partial<InferValidation<V>> {
  return getValidator(validation).validate(value, { ...options, partialValidation: true })
}
