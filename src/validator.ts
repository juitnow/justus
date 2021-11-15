import type { ValidationOptions, Validator } from './validation'

/**
 * A `Validator` is an object capable of validating a given _value_ and
 * (possibly) converting it the required type `T`.
 *
 * @public
 */
export abstract class AbstractValidator<T = any> implements Validator<T> {
  /**
   * Validate a _value_ and optionally convert it to the required `Type`.
   *
   * @param value - The _value_ to validate
   */
  abstract validate(value: unknown, options: ValidationOptions): T
}
