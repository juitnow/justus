import { Validator } from '../types'
import { assertValidation } from '../errors'

export class BooleanValidator extends Validator<boolean> {
  validate(value: unknown): boolean {
    assertValidation(typeof value === 'boolean', 'Value is not a "boolean"')
    return value
  }
}

export const boolean = new BooleanValidator()
