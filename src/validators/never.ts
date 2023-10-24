import { ValidationError } from '../errors'
import { AbstractValidator } from '../types'

import type { ValidationOptions } from '../types'

/** A `Validator` validating _nothing_. */
export class NeverValidator extends AbstractValidator<never> {
  optional: true = true

  validate(value: unknown, options: ValidationOptions = {}): never {
    const { stripForbiddenProperties } = options

    // @ts-expect-error
    if (stripForbiddenProperties || (value === undefined)) return
    throw new ValidationError('Forbidden property')
  }
}

/** The `Validator` validating _nothing_. */
export const never = new NeverValidator()
