import { Validator } from '../validator'

export class AnyValidator extends Validator<any> {
  validate(value: unknown): any {
    return value
  }
}

export const any = new AnyValidator()
