import { assertValidation } from '../errors'
import { registry } from '../registry'
import { AbstractValidator } from '../types'

import type { Validator } from '../types'

/** A `Validator` for _constants_. */
export class ConstantValidator<T extends string | number | boolean | bigint | null> extends AbstractValidator<T> {
  readonly constant: T

  constructor(constant: T) {
    super()
    this.constant = constant
  }

  validate(value: unknown): T {
    assertValidation(value === this.constant, `Value does not match constant "${this.constant}"`)
    return value as T
  }
}

/** Validate _constants_. */
export function constant<T extends string | number | boolean | bigint | null>(constant: T): Validator<T> {
  return new ConstantValidator(constant)
}

// Register our "constant" validator
registry.set('constant', ConstantValidator)
