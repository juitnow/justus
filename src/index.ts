import type { InferValidation, Validation, ValidationOptions } from './types'
import { getValidator } from './utilities'

export { object } from './objects'
export { allowAdditionalProperties, readonly, optional } from './schema'
export { ValidationError } from './errors'

export * from './types'

// Validators
export { allOf, AllOfValidator } from './validators/union'
export { any, AnyValidator } from './validators/any'
export { array, arrayOf, ArrayValidator } from './validators/array'
export { boolean, BooleanValidator } from './validators/boolean'
export { constant, ConstantValidator } from './validators/constant'
export { number, NumberValidator } from './validators/number'
export { oneOf, OneOfValidator } from './validators/union'
export { string, StringValidator } from './validators/string'
export { tuple, TupleValidator } from './validators/tuple'


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
