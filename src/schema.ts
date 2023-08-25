import { getValidator } from './utilities'
import { any } from './validators/any'

import type {
  AdditionalProperties,
  InferValidation,
  Validation,
  Validator,
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
  if (options === false) return { [Symbol.justusAdditionalValidator]: false }
  if (options === true) return { [Symbol.justusAdditionalValidator]: any }

  return { [Symbol.justusAdditionalValidator]: options ? getValidator(options) : any }
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

// Remember to inject our `any` validator as the default for when
// `allowAdditionalProperties` is _not_ used as a function
allowAdditionalProperties[Symbol.justusAdditionalValidator] = any
