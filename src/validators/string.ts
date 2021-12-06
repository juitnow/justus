import { Branding, Validator } from '../types'
import { assertValidation, assertSchema } from '../errors'
import { makeTupleRestIterable } from './tuple'

/** Constraints to validate a `string` with. */
export interface StringConstraints {
  /** The _maximum_ length of a valid `string`: `value.length <= maxLength` */
  maxLength?: number,
  /** The _minimum_ length of a valid `string`: `value.length >= minLength` */
  minLength?: number,
  /** A `RegExp` enforcing a particular pattern for a valid `string`: `pattern.test(value)` */
  pattern?: RegExp,
}

/** Constraints to validate a `string` with extra branding information. */
export interface BrandedStringConstraints<B extends string> extends StringConstraints {
  /** The _brand_ of the string (will generate a `__brand_${B}` type property */
  brand: B
}

/** A `Validator` validating `string`s. */
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

    assertSchema(minLength >= 0, `Constraint "minLength" (${minLength}) must be non-negative`)
    assertSchema(maxLength >= 0, `Constraint "maxLength" (${maxLength}) must be non-negative`)
    assertSchema(minLength <= maxLength, `Constraint "minLength" (${minLength}) is greater than "maxLength" (${maxLength})`)

    this.maxLength = maxLength
    this.minLength = minLength
    this.pattern = pattern
  }

  validate(value: unknown): S {
    assertValidation(typeof value == 'string', 'Value is not a "string"')

    assertValidation(value.length >= this.minLength,
        `String must have a minimum length of ${this.minLength}`)

    assertValidation(value.length <= this.maxLength,
        `String must have a maximum length of ${this.maxLength}`)

    assertValidation(this.pattern ? this.pattern.test(value) : true,
        `String does not match required pattern ${this.pattern}`)

    return value as S
  }
}

const anyStringValidator = new class extends Validator<string> {
  validate(value: unknown): string {
    assertValidation(typeof value == 'string', 'Value is not a "string"')
    return value
  }
}

function _string(): Validator<string>
function _string(constraints?: StringConstraints): StringValidator<string>
function _string<S extends string>(constraints?: StringConstraints): StringValidator<S>
function _string<B extends string>(constraints: BrandedStringConstraints<B>): StringValidator<string & Branding<B>>

function _string(constraints?: StringConstraints): Validator<string> {
  return constraints ? new StringValidator(constraints) : anyStringValidator
}

/** Validate `string`s. */
export const string = makeTupleRestIterable(_string)
