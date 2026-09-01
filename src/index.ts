/* ========================================================================== *
 * EXPORTS                                                                    *
 * ========================================================================== */

// All our types and utilities
export * from './errors.ts'
export * from './schema.ts'
export * from './types.ts'
export * from './utilities.ts'

// Validators
export { any, AnyValidator } from './validators/any.ts'
export { AnyArrayValidator, array, arrayOf, ArrayValidator } from './validators/array.ts'
export { AnyBigIntValidator, bigint, BigIntValidator } from './validators/bigint.ts'
export { boolean, BooleanValidator } from './validators/boolean.ts'
export { constant, ConstantValidator } from './validators/constant.ts'
export { date, DateValidator } from './validators/date.ts'
export { never, NeverValidator } from './validators/never.ts'
export { AnyNumberValidator, number, NumberValidator } from './validators/number.ts'
export { AnyObjectValidator, object, objectOf, ObjectValidator } from './validators/object.ts'
export { optional, OptionalValidator } from './validators/optional.ts'
export { AnyStringValidator, string, StringValidator } from './validators/string.ts'
export { tuple, TupleValidator } from './validators/tuple.ts'
export { allOf, AllOfValidator, oneOf, OneOfValidator } from './validators/union.ts'

// Validator Types
export type { ArrayConstraints, arrayValidatorFactory } from './validators/array.ts'
export type { bigintValidatorFactory, BrandedBigIntConstraints } from './validators/bigint.ts'
export type { BooleanConstraints, booleanValidatorFactory } from './validators/boolean.ts'
export type { DateConstraints, dateValidatorFactory } from './validators/date.ts'
export type { BrandedNumberConstraints, numberValidatorFactory } from './validators/number.ts'
export type { objectValidatorFactory } from './validators/object.ts'
export type { BrandedStringConstraints, StringConstraints, stringValidatorFactory } from './validators/string.ts'
export type { TupleMember } from './validators/tuple.ts'

/* ========================================================================== *
 * VALIDATE FUNCTION (our main entry point)                                   *
 * ========================================================================== */

import { getValidator } from './utilities.ts'

import type { InferValidation, Validation, ValidationOptions } from './types.ts'

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
