import { ValidationError } from '../errors.ts'
import { AbstractValidator } from '../types.ts'

import type { ValidationOptions } from '../types.ts'

/** A `Validator` validating _nothing_. */
export class NeverValidator extends AbstractValidator<never> {
  override optional = true as const

  validate(value: unknown, options: ValidationOptions = {}): never {
    const { stripForbiddenProperties } = options

    // @ts-expect-error the type declaration should never return, but we do!
    if (stripForbiddenProperties || (value === undefined)) return
    throw new ValidationError('Forbidden property')
  }
}

/** The `Validator` validating _nothing_. */
export const never = new NeverValidator()
