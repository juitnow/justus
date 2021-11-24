import { getValidator } from './utilities'

import { Validation, InferValidation } from './types'

/* ========================================================================== *
 * VALIDATE                                                                   *
 * ========================================================================== */

export interface ValidationOptions {
  readonly stripAdditionalProperties: boolean,
  readonly stripForbiddenProperties: boolean,
}

type PartialValidationOptions = {
  -readonly [ key in keyof ValidationOptions ]?: ValidationOptions[key] | undefined
}

export function validate<V extends Validation>(
    validator: V,
    value: any,
    options: PartialValidationOptions = {},
): InferValidation<V> {
  const opts: ValidationOptions = {
    stripAdditionalProperties: false,
    stripForbiddenProperties: false,
    ...options,
  }

  return getValidator(validator).validate(value, opts)
}
