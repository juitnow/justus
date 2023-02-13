import { AbstractValidator, Validator, ValidationOptions, Validation, InferValidation } from '../types'
import { getValidator } from '../utilities'

/**
 * A `Validator` for _optional_ properties (that is `type | undefined`).
 */
export class OptionalValidator<T = any> extends AbstractValidator<T | undefined> {
  validator: Validator<T>
  optional: true = true

  constructor(validator: Validator<T>) {
    super()
    this.validator = validator
  }

  validate(value: unknown, options: ValidationOptions): T | undefined {
    if (value === undefined) return value
    return this.validator.validate(value, options)
  }
}

/**
 * Ensure that the property is marked as _optional_ in the `Schema`.
 *
 * @param validation - A `Validation` to be marked as _optional_.
 */
export function optional<V extends Validation>(validation: V): OptionalValidator<InferValidation<V>> {
  const validator = getValidator(validation)
  return new OptionalValidator(validator)
}
