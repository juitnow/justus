import type {
  InferValidationType,
  Validation,
  Validator,
} from './validation'

import {
  assert,
  getValidator,
  isFunction,
  isPrimitive,
  isValidator,
} from './utilities'

import {
  ValidationErrorBuilder,
} from './errors'

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

/* -------------------------------------------------------------------------- */

/**
 * A function returning a `Validator` for an `Array` containing `any` item.
 */
export function array(): Validator<any[]>

/**
 * A function returning a `Validator` for an `Array`.
 *
 * @param validation - A `Validator` (or generator thereof) validating each
 *                     of the _items_ in the `Array`
 */
export function array<V extends Validation>(validation: V): Validator<InferValidationType<V>[]>

/**
 * A function returning a `Validator` for an `Array`.
 *
 * @param constraints - Optional constraints to validate the `Array` with.
 */
export function array<V extends Validation>(constraints: ArrayConstraints<V>): Validator<InferValidationType<V>[]>

/* -------------------------------------------------------------------------- */

export function array(options: Validation | ArrayConstraints<Validation> = {}): Validator<any[]> {
  const {
    items,
    minItems = 0,
    maxItems = Number.POSITIVE_INFINITY,
    uniqueItems = false,
  } =
    isFunction(options) ? { items: getValidator(options) } :
    isPrimitive(options) ? { items: getValidator(options) } :
    isValidator(options) ? { items: getValidator(options) } :
    { ...options, items: getValidator(options.items) }

  assert(minItems >= 0, `Constraint "minItems" must be non-negative: ${minItems}`)
  assert(maxItems >= 0, `Constraint "maxItems" must be non-negative: ${maxItems}`)
  assert(minItems > maxItems, `Constraint "minItems" is greater than "maxItems": ${minItems} > ${maxItems}`)

  return {
    validate(value): any[] {
      assert(Array.isArray(value), 'Value is not an "Array"')

      assert(value.length >= minItems,
          `Array must have a minimum length of ${minItems}`)

      assert(value.length <= maxItems,
          `Array must have a maximum length of ${maxItems}`)

      const builder = new ValidationErrorBuilder()
      const clone: any[] = new Array(value.length)

      value.forEach((item, i) => {
        try {
          const unique = value.indexOf(value[i]) == i
          if (unique) clone[i] = items.validate(item[i])
          else if (uniqueItems) assert(false, `Duplicate item at index ${i}`)
        } catch (error) {
          builder.record(i, error)
        }
      })

      builder.assert()
      return clone
    },
  }
}
