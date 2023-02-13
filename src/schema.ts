import { any } from './validators/any'
import { getValidator } from './utilities'

import {
  AdditionalProperties,
  InferValidation,
  Validation,
  Validator,
  additionalValidator,
  AbstractValidator,
  ValidationOptions,
} from './types'

/* ========================================================================== *
 * ADDITIONAL PROPERTIES IN SCHEMAS                                           *
 * ========================================================================== */

/** Internal definition of `allowAdditionalProperties(...)` */
export function _allowAdditionalProperties(): AdditionalProperties<Validator<any>>
export function _allowAdditionalProperties(allow: true): AdditionalProperties<Validator<any>>
export function _allowAdditionalProperties(allow: false): AdditionalProperties<false>
export function _allowAdditionalProperties<V extends Validation>(validation: V): AdditionalProperties<Validator<InferValidation<V>>>

export function _allowAdditionalProperties(options?: Validation | boolean): AdditionalProperties<Validator | false> {
  if (options === false) return { [additionalValidator]: false }
  if (options === true) return { [additionalValidator]: any }

  return { [additionalValidator]: options ? getValidator(options) : any }
}

/**
 * Allow additional properties in `Schema`s.
 *
 * This function can be called with a `boolean` argument (`true` allow _any_
 * additional property, `false` do not allow additional properties) or with a
 * `Validation` that will be used to validate additional properties.
 *
 * @param allow - A `boolean` or a `Validator` instance
 */
export const allowAdditionalProperties = _allowAdditionalProperties as
  typeof _allowAdditionalProperties & AdditionalProperties<Validator<any>>

allowAdditionalProperties[additionalValidator] = any

/* ========================================================================== *
 * SCHEMA KEYS MODIFIERS                                                      *
 * ========================================================================== */

export class ReadonlyValidator<T = any> extends AbstractValidator<T> {
  validator: Validator<T>
  readonly: true = true

  constructor(validator: Validator<T>) {
    super()
    this.validator = validator
    this.optional = validator.optional
    this.readonly = true
  }

  validate(value: unknown, options: ValidationOptions): T {
    return this.validator.validate(value, options)
  }
}

/**
 * Ensure that the property is marked as _read only_ in the `Schema`.
 *
 * @param validation - A `Validation` to be marked as _read only_.
 */
export function readonly<V extends Validation>(validation: V): ReadonlyValidator<InferValidation<V>> {
  const validator = getValidator(validation)
  return new ReadonlyValidator(validator)
}


export class OptionalValidator<T = any> extends AbstractValidator<T | undefined> {
  validator: Validator<T>
  optional: true = true

  constructor(validator: Validator<T>) {
    super()
    this.validator = validator
    this.readonly = validator.readonly
    this.optional = true
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
