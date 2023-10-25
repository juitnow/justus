import { assertSchema, assertValidation, ValidationError } from '../errors'
import { AbstractValidator, makeValidatorFactory } from '../types'

import type { Branding, Validator } from '../types'

/* ========================================================================== */

/** Constraints to validate a `bigint` with. */
export interface BigIntConstraints {
  /** The value for which a `bigint` must be multiple of for it to be valid */
  multipleOf?: bigint | number,
  /** The _inclusive_ maximum value for a valid `bigint`: `value <= maximum` */
  maximum?: bigint | number,
  /** The _inclusive_ minimum value for a valid `bigint`: `value >= minimum` */
  minimum?: bigint | number,
  /** The _exclusive_ maximum value for a valid `bigint`: `value < exclusiveMaximum` */
  exclusiveMaximum?: bigint | number,
  /** The _exclusive_ minimum value for a valid `bigint`: `value > exclusiveMaximum` */
  exclusiveMinimum?: bigint | number,
  /** Allow bigints to be parsed from strings (e.g. `123.456` or `0x0CAFE`, default: `false`) */
  fromString?: boolean,
  /** Allow bigints to be parsed from numbers (default: `true`) */
  fromNumber?: boolean,
}

/** Constraints to validate a `bigint` with extra branding information. */
export interface BrandedBigIntConstraints<B extends string> extends BigIntConstraints {
  /** The _brand_ of the string (will generate a `__brand_${B}` type property */
  brand: B
}

/** A `Validator` validating any `bigint`. */
export class AnyBigIntValidator extends AbstractValidator<bigint> {
  validate(value: unknown): bigint {
    if (typeof value === 'number') {
      try {
        value = BigInt(value)
      } catch (error) {
        throw new ValidationError('BigInt can not be parsed from number')
      }
    }
    assertValidation(typeof value === 'bigint', 'Value is not a "bigint"')
    return value
  }
}

/** A `Validator` validating `bigint`s with constaints. */
export class BigIntValidator<N extends bigint = bigint> extends AbstractValidator<N, bigint> {
  readonly fromString: boolean
  readonly fromNumber: boolean
  readonly exclusiveMaximum?: bigint
  readonly exclusiveMinimum?: bigint
  readonly maximum?: bigint
  readonly minimum?: bigint
  readonly multipleOf?: bigint
  readonly brand?: string

  constructor(constraints: BigIntConstraints = {}) {
    super()

    const {
      exclusiveMaximum,
      exclusiveMinimum,
      maximum,
      minimum,
      multipleOf,
      fromString = false,
      fromNumber = true,
    } = constraints

    if ('brand' in constraints) this.brand = (<any> constraints).brand
    this.fromString = fromString
    this.fromNumber = fromNumber

    const _exclusiveMaximum = exclusiveMaximum === undefined ? undefined : BigInt(exclusiveMaximum)
    const _exclusiveMinimum = exclusiveMinimum === undefined ? undefined : BigInt(exclusiveMinimum)
    const _maximum = maximum === undefined ? undefined : BigInt(maximum)
    const _minimum = minimum === undefined ? undefined : BigInt(minimum)
    const _multipleOf = multipleOf === undefined ? undefined : BigInt(multipleOf)

    if ((_maximum !== undefined) && (_minimum !== undefined)) {
      assertSchema(_maximum >= _minimum, `Constraint "minimum" (${_minimum}) is greater than "maximum" (${_maximum})`)
    }

    if ((_exclusiveMaximum !== undefined) && (_minimum !== undefined)) {
      assertSchema(_exclusiveMaximum > _minimum,
          `Constraint "exclusiveMaximum" (${_exclusiveMaximum}) must be greater than "minimum" (${_minimum})`)
    }

    if ((_exclusiveMinimum !== undefined) && (_maximum != undefined)) {
      assertSchema(_maximum > _exclusiveMinimum,
          `Constraint "maximum" (${_maximum}) must be greater than "exclusiveMinimum" (${_exclusiveMinimum})`)
    }

    if ((_exclusiveMinimum != undefined) && (_exclusiveMaximum !== undefined)) {
      assertSchema(_exclusiveMaximum > _exclusiveMinimum,
          `Constraint "exclusiveMaximum" (${_exclusiveMaximum}) must be greater than "exclusiveMinimum" (${_exclusiveMinimum})`)
    }

    if (_multipleOf !== undefined) {
      assertSchema(_multipleOf > 0, `Constraint "multipleOf" (${_multipleOf}) must be greater than zero`)
    }

    this.exclusiveMaximum = _exclusiveMaximum
    this.exclusiveMinimum = _exclusiveMinimum
    this.maximum = _maximum
    this.minimum = _minimum
    this.multipleOf = _multipleOf
  }

  validate(value: unknown): N {
    // Allow parsing from strings or numbers
    if (((typeof value === 'string') && (this.fromString)) ||
        ((typeof value === 'number') && (this.fromNumber))) {
      try {
        value = BigInt(value)
      } catch (error) {
        throw new ValidationError('BigInt can not be parsed from ' + typeof value)
      }
    }

    assertValidation(typeof value === 'bigint', 'Value is not a "bigint"')

    assertValidation(((this.minimum === undefined) || (value >= this.minimum)),
        `BigInt is less than ${this.minimum}`)
    assertValidation(((this.maximum === undefined) || (value <= this.maximum)),
        `BigInt is greater than ${this.maximum}`)
    assertValidation((this.exclusiveMinimum === undefined) || (value > this.exclusiveMinimum),
        `BigInt is less than or equal to ${this.exclusiveMinimum}`)
    assertValidation((this.exclusiveMaximum === undefined) || (value < this.exclusiveMaximum),
        `BigInt is greater than or equal to ${this.exclusiveMaximum}`)
    assertValidation((this.multipleOf === undefined) || (!(value % this.multipleOf)),
        `BigInt is not a multiple of ${this.multipleOf}`)

    return value as N
  }
}

export function bigintValidatorFactory(constraints: BigIntConstraints): BigIntValidator<bigint>
export function bigintValidatorFactory<N extends bigint>(constraints: BigIntConstraints): BigIntValidator<N>
export function bigintValidatorFactory<B extends string>(constraints: BrandedBigIntConstraints<B>): BigIntValidator<bigint & Branding<B>>
export function bigintValidatorFactory(constraints: BigIntConstraints): Validator<bigint> {
  return new BigIntValidator(constraints)
}

/** Validate `bigint`s. */
export const bigint = makeValidatorFactory(new AnyBigIntValidator(), bigintValidatorFactory)
