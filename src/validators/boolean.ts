import { Validator } from '../validator'
import { ValidationError } from '../errors'

export class BooleanValidator extends Validator<boolean> {
  validate(value: any): boolean {
    ValidationError.assert(typeof value === 'boolean', 'Value is not a "boolean"')
    return value
  }
}

export const boolean = new BooleanValidator()
