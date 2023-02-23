import { assertValidation } from '../errors'
import { AbstractValidator, makeValidatorFactory } from '../types'

/** Constraints to validate a `boolean` with. */
export interface BooleanConstraints {
  /**
   * Allow booleans to be parsed from strings (default: `false`).
   *
   * The string in question _MUST_ be either `true` or `false`, and will be
   * compared regardless of case.
   */
  fromString?: boolean,
}


/** A `Validator` validating `boolean`s. */
export class BooleanValidator extends AbstractValidator<boolean> {
  readonly fromString: boolean

  constructor(constraints: BooleanConstraints = {}) {
    super()
    const { fromString = false } = constraints
    this.fromString = fromString
  }

  validate(value: unknown): boolean {
    // Allow parsing from strings
    if ((typeof value == 'string') && (this.fromString)) {
      const string = value.toLowerCase()
      const parsed = string === 'true' ? true : string === 'false' ? false : undefined
      assertValidation(parsed !== undefined, 'Boolean can not be parsed from string')
      value = parsed
    }

    assertValidation(typeof value === 'boolean', 'Value is not a "boolean"')
    return value
  }
}

function _boolean(constraints: BooleanConstraints): BooleanValidator {
  return new BooleanValidator(constraints)
}

/** The `Validator` for `boolean`s. */
export const boolean = makeValidatorFactory(new BooleanValidator(), _boolean)
