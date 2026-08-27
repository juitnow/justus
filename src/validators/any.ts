import { AbstractValidator } from '../types.ts'

/** A `Validator` validating _anything_. */
export class AnyValidator extends AbstractValidator<any> {
  validate(value: unknown): any {
    return value
  }
}

/** The `Validator` validating _anything_. */
export const any = new AnyValidator()
