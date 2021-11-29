import { Validator } from '../types'
import { assertValidation } from '../errors'

/** A `Validator` validating `boolean`s. */
export class BooleanValidator extends Validator<boolean> {
  validate(value: unknown): boolean {
    assertValidation(typeof value === 'boolean', 'Value is not a "boolean"')
    return value
  }
}

/** The `Validator` for `boolean`s. */
export const boolean = new BooleanValidator()
