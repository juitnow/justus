import { AbstractValidator } from '../types'
import { getValidator } from '../utilities'

import type { InferInput, InferValidation, Validation, ValidationOptions, Validator } from '../types'

/**
 * A `Validator` for _optional_ properties (that is `type | undefined`).
 */
export class OptionalValidator<
  T = any, // the type of the "validation", that is the optional type to validate
  I = T, // the _input_ type of the "validation", that is anything acceptable
  D = undefined, // the default value (or undefined)
> extends AbstractValidator<D extends undefined ? T | undefined : T, I | undefined> {
  validator: Validator<T>
  defaultValue: T | undefined

  constructor(validator: Validator<T>)
  constructor(validator: Validator<T>, defaultValue: D)
  constructor(validator: Validator<T>, defaultValue?: void)
  constructor(validator: Validator<T>, defaultValue?: D) {
    super()
    this.validator = validator
    this.optional = (defaultValue === undefined) as any
    if (this.optional) {
      this.defaultValue = undefined
      return
    }

    try {
      this.defaultValue = validator.validate(defaultValue, {})
    } catch (cause) {
      throw new TypeError('Default value does not match validator', { cause })
    }
  }

  validate(value: unknown, options?: ValidationOptions): D extends undefined ? T | undefined : T
  validate(value: unknown, options?: ValidationOptions): T | undefined {
    if (value === undefined) return structuredClone(this.defaultValue) // do not validate defaults!
    return this.validator.validate(value, options)
  }
}

/**
 * Ensure that the property is marked as _optional_ in the `Schema`.
 *
 * @param validation - A `Validation` to be marked as _optional_.
 */
export function optional<
  V extends Validation,
>(validation: V): OptionalValidator<InferValidation<V>, InferInput<V>, undefined>

export function optional<
  V extends Validation, D,
>(validation: V, defaultValue: D): OptionalValidator<InferValidation<V>, InferInput<V>, D>

export function optional<
  V extends Validation, D,
>(validation: V, defaultValue?: D): OptionalValidator<InferValidation<V>, InferInput<V>, D> {
  const validator = getValidator(validation)
  return new OptionalValidator(validator, defaultValue)
}
