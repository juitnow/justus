import { assertSchema, assertValidation } from '../errors'
import { AbstractValidator, makeValidatorFactory } from '../types'

import type { Branding, Validator } from '../types'

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

/** A `Validator` validating any `string`. */
export class AnyStringValidator extends AbstractValidator<string> {
  validate(value: unknown): string {
    assertValidation(typeof value == 'string', 'Value is not a "string"')
    return value
  }
}

/** A `Validator` validating `string`s with constraints. */
export class StringValidator<S extends string = string> extends AbstractValidator<S> {
  readonly maxLength: number
  readonly minLength: number
  readonly pattern?: RegExp
  readonly brand?: string

  constructor(constraints: StringConstraints = {}) {
    super()

    const {
      minLength = 0,
      maxLength = Number.MAX_SAFE_INTEGER,
      pattern,
    } = constraints

    if ('brand' in constraints) this.brand = (<any> constraints).brand

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

export function stringFactory(constraints: StringConstraints): StringValidator<string>
export function stringFactory<S extends string>(constraints: StringConstraints): StringValidator<S>
export function stringFactory<B extends string>(constraints: BrandedStringConstraints<B>): StringValidator<string & Branding<B>>
export function stringFactory(constraints: StringConstraints): Validator<string> {
  return new StringValidator(constraints)
}

/** Validate `string`s. */
export const string = makeValidatorFactory(new AnyStringValidator(), stringFactory)
