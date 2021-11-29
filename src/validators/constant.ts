import { Validator } from '../types'
import { assertValidation } from '../errors'

/** A `Validator` for _constants_. */
export class ConstantValidator<T extends string | number | boolean | null> extends Validator<T> {
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
export function constant<T extends string | number | boolean | null>(constant: T): Validator<T> {
  return new ConstantValidator(constant)
}

/** The `Validator` for the `null` constant. */
export const nullValidator = new ConstantValidator(null)
