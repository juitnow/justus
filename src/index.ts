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
export { AnyBigIntValidator, BigIntValidator, bigint } from './validators/bigint'
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
export type { ArrayConstraints, arrayValidatorFactory } from './validators/array'
export type { BrandedBigIntConstraints, bigintValidatorFactory } from './validators/bigint'
export type { BooleanConstraints, booleanValidatorFactory } from './validators/boolean'
export type { DateConstraints, dateValidatorFactory } from './validators/date'
export type { BrandedNumberConstraints, numberValidatorFactory } from './validators/number'
export type { objectValidatorFactory } from './validators/object'
export type { BrandedStringConstraints, StringConstraints, stringValidatorFactory } from './validators/string'
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
  const opts: ValidationOptions = {
    partialValidation: false,
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
 *   partialValidation: false,
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
    partialValidation: false,
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
 * This is equivalent to:
 *
 * ```
 * validate(validation, value, {
 *   partialValidation: true,
 *   stripAdditionalProperties: true,
 *   stripForbiddenProperties: false,
 *   stripOptionalNulls: true,
 * })
 * ```
 *
 * This function also correctly represents the returned type as a
 * `Partial<...>` type.
 */
export function partial<V extends Validation>(
    validation: V,
    value: any,
    options?: ValidationOptions,
): Partial<InferValidation<V>> {
  return getValidator(validation).validate(value, {
    partialValidation: true,
    stripAdditionalProperties: true,
    stripForbiddenProperties: false,
    stripOptionalNulls: true,
    ...options,
  })
}
