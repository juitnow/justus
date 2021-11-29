import type { InferValidation, Validation, ValidationOptions } from './types'
import { getValidator } from './utilities'

// All our types and utilities
export * from './errors'
export * from './schema'
export * from './types'
export * from './utilities'

// Validators
export { allOf, oneOf, AllOfValidator, OneOfValidator } from './validators/union'
export { any, AnyValidator } from './validators/any'
export { array, arrayOf, ArrayValidator } from './validators/array'
export { boolean, BooleanValidator } from './validators/boolean'
export { constant, ConstantValidator } from './validators/constant'
export { date, DateValidator } from './validators/date'
export { number, NumberValidator } from './validators/number'
export { object, ObjectValidator } from './validators/object'
export { string, StringValidator } from './validators/string'
export { tuple, TupleValidator } from './validators/tuple'

// Validate function
export type ValidateOptions = {
  -readonly [ key in keyof ValidationOptions ]?: ValidationOptions[key] | undefined
}

export function validate<V extends Validation>(
    validator: V,
    value: any,
    options: ValidateOptions = {},
): InferValidation<V> {
  const opts: ValidationOptions = {
    stripAdditionalProperties: false,
    stripForbiddenProperties: false,
    ...options,
  }

  return getValidator(validator).validate(value, opts)
}
