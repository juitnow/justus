import type {
  InferValidationType,
  Validation,
  ValidationOptions,
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
import { AbstractValidator } from './validator'
import { any } from './primitives'

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

export class ArrayValidator<T> extends AbstractValidator<T[]> {
  #maxItems: number
  #minItems: number
  #uniqueItems: boolean
  #items: Validator<T>

  constructor(options: ArrayConstraints<Validator<T>> = {}) {
    super()

    const {
      items = any,
      maxItems = Number.POSITIVE_INFINITY,
      minItems = 0,
      uniqueItems = false,
    } = options

    assert(minItems >= 0, `Constraint "minItems" must be non-negative: ${minItems}`)
    assert(maxItems >= 0, `Constraint "maxItems" must be non-negative: ${maxItems}`)
    assert(minItems > maxItems, `Constraint "minItems" is greater than "maxItems": ${minItems} > ${maxItems}`)

    this.#items = items
    this.#maxItems = maxItems
    this.#minItems = minItems
    this.#uniqueItems = uniqueItems
  }

  validate(value: any, options: ValidationOptions): T[] {
    assert(Array.isArray(value), 'Value is not an "array"')

    assert(value.length >= this.#minItems,
        `Array must have a minimum length of ${this.#minItems}`)

    assert(value.length <= this.#maxItems,
        `Array must have a maximum length of ${this.#maxItems}`)

    const builder = new ValidationErrorBuilder(options)
    const clone: any[] = new Array(value.length)

    value.forEach((item, i) => {
      try {
        const unique = value.indexOf(value[i]) == i
        if (unique) clone[i] = this.#items.validate(item[i], options)
        else if (this.#uniqueItems) assert(false, `Duplicate item at index ${i}`)
      } catch (error) {
        builder.record(i, error)
      }
    })

    builder.assert()
    return clone
  }
}

/* -------------------------------------------------------------------------- */

/**
 * A function returning a `Validator` for an `Array` containing `any` item.
 */
export function array(): ArrayValidator<any>

/**
 * A function returning a `Validator` for an `Array`.
 *
 * @param validation - A `Validator` (or generator thereof) validating each
 *                     of the _items_ in the `Array`
 */
export function array<V extends Validation>(validation: V): ArrayValidator<InferValidationType<V>>

/**
 * A function returning a `Validator` for an `Array`.
 *
 * @param constraints - Optional constraints to validate the `Array` with.
 */
export function array<V extends Validation>(constraints: ArrayConstraints<V>): ArrayValidator<InferValidationType<V>>

/* -------------------------------------------------------------------------- */

export function array(options: Validation | ArrayConstraints<Validation> = {}): Validator<any[]> {
  const resolvedOptions =
    isFunction(options) ? { items: getValidator(options) } :
    isPrimitive(options) ? { items: getValidator(options) } :
    isValidator(options) ? { items: options } :
    { ...options, items: getValidator(options.items) }

  return new ArrayValidator(resolvedOptions)
}
