import { Validator } from '../types'
import { ValidationError, assert } from '../errors'
import { makeTupleRestIterable } from '../utilities'

/** Constraints to validate a `string` with. */
export interface StringConstraints {
  /** The _maximum_ length of a valid `string`: `value.length <= maxLength` */
  maxLength?: number,
  /** The _minimum_ length of a valid `string`: `value.length >= minLength` */
  minLength?: number,
  /** A `RegExp` enforcing a particular pattern for a valid `string`: `pattern.test(value)` */
  pattern?: RegExp,
}

export class StringValidator<S extends string = string> extends Validator<S> {
  readonly maxLength: number
  readonly minLength: number
  readonly pattern?: RegExp

  constructor(constraints: StringConstraints = {}) {
    super()

    const {
      minLength = 0,
      maxLength = Number.MAX_SAFE_INTEGER,
      pattern,
    } = constraints

    assert(minLength >= 0, `Constraint "minLength" (${minLength}) must be non-negative`)
    assert(maxLength >= 0, `Constraint "maxLength" (${maxLength}) must be non-negative`)
    assert(minLength <= maxLength, `Constraint "minLength" (${minLength}) is greater than "maxLength" (${maxLength})`)

    this.maxLength = maxLength
    this.minLength = minLength
    this.pattern = pattern
  }

  validate(value: unknown): S {
    ValidationError.assert(typeof value == 'string', 'Value is not a "string"')

    ValidationError.assert(value.length >= this.minLength,
        `String must have a minimum length of ${this.minLength}`)

    ValidationError.assert(value.length <= this.maxLength,
        `String must have a maximum length of ${this.maxLength}`)

    ValidationError.assert(this.pattern ? this.pattern.test(value) : true,
        `String does not match required pattern ${this.pattern}`)

    return value as S
  }
}

const anyStringValidator = new class extends Validator<string> {
  validate(value: unknown): string {
    ValidationError.assert(typeof value == 'string', 'Value is not a "string"')
    return value
  }
}

function _string(): Validator<string>
function _string<S extends string = string>(constraints?: StringConstraints): StringValidator<S>

function _string(constraints?: StringConstraints): Validator<string> {
  return constraints ? new StringValidator(constraints) : anyStringValidator
}

export const string = makeTupleRestIterable(_string)
