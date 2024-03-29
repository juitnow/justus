import { assertSchema, assertValidation, ValidationErrorBuilder } from '../errors'
import { AbstractValidator, makeValidatorFactory } from '../types'
import { getValidator } from '../utilities'
import { any } from './any'

import type { InferInput, InferValidation, Validation, ValidationOptions, Validator } from '../types'

/* ========================================================================== *
 * ARRAYS VALIDATION                                                           *
 * ========================================================================== */

/** Constraints to validate an `Array` with. */
export interface ArrayConstraints<V extends Validation> {
  /** The _maximum_ number of elements a valid `Array`: `value.length <= maxItems` */
  maxItems?: number,
  /** The _minimum_ number of elements a valid `Array`: `value.length >= minItems` */
  minItems?: number,
  /** A flag indicating whether an `Array`'s elements must be unique */
  uniqueItems?: boolean,
  /** A `Validator` validating each individual item in an `Array` */
  items?: V,
}

/** Basic validator for `Array` instances. */
export class AnyArrayValidator<T = any> extends AbstractValidator<T[]> {
  validate(value: unknown): T[] {
    assertValidation(Array.isArray(value), 'Value is not an "array"')
    return [ ...value ]
  }
}

/** A validator for `Array` instances with constraints. */
export class ArrayValidator<T, I = T> extends AbstractValidator<T[], I[]> {
  readonly maxItems: number
  readonly minItems: number
  readonly uniqueItems: boolean
  readonly items: Validator<T>

  constructor(options: ArrayConstraints<Validator<T>> = {}) {
    super()

    const {
      items = any,
      maxItems = Number.POSITIVE_INFINITY,
      minItems = 0,
      uniqueItems = false,
    } = options

    assertSchema(minItems >= 0, `Constraint "minItems" (${minItems}) must be non-negative`)
    assertSchema(maxItems >= 0, `Constraint "maxItems" (${maxItems}) must be non-negative`)
    assertSchema(minItems <= maxItems, `Constraint "minItems" (${minItems}) is greater than "maxItems" (${maxItems})`)

    this.items = items
    this.maxItems = maxItems
    this.minItems = minItems
    this.uniqueItems = uniqueItems
  }

  validate(value: unknown, options?: ValidationOptions): T[] {
    assertValidation(Array.isArray(value), 'Value is not an "array"')

    assertValidation(value.length >= this.minItems,
        `Array must have a minimum length of ${this.minItems}`)

    assertValidation(value.length <= this.maxItems,
        `Array must have a maximum length of ${this.maxItems}`)

    const builder = new ValidationErrorBuilder()
    const clone: any[] = new Array(value.length)

    value.forEach((item, i) => {
      try {
        const position = value.indexOf(value[i])
        if (position === i) {
          clone[i] = this.items.validate(item, options)
        } else if (this.uniqueItems) {
          builder.record(`Duplicate of item at index ${position}`, i)
        } else {
          clone[i] = clone[position]
        }
      } catch (error) {
        builder.record(error, i)
      }
    })

    return builder.assert(clone)
  }
}

/* -------------------------------------------------------------------------- */

export function arrayValidatorFactory<V extends Validation>(
    constraints: ArrayConstraints<V>,
): ArrayValidator<InferValidation<V>, InferInput<V>> {
  const items = constraints.items ? getValidator(constraints.items) : any
  return new ArrayValidator<any>({ ...constraints, items })
}

/** Validate `Array`s. */
export const array = makeValidatorFactory(new AnyArrayValidator(), arrayValidatorFactory)

/** Validate `Array`s containing only the specified elements. */
export function arrayOf<V extends Validation>(validation: V): Validator<InferValidation<V>[], InferInput<V>[]> {
  return new ArrayValidator({ items: getValidator(validation) })
}
