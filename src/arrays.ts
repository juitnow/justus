import type {
  InferValidationType,
  Validation,
  Validator,
} from './validation'

import {
  getValidator,
  isFunction,
  isPrimitive,
  isValidator,
} from './utilities'

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

  if (minItems < 0) {
    throw new TypeError(`Constraint "minItems" must be non-negative: ${minItems}`)
  }

  if (maxItems < 0) {
    throw new TypeError(`Constraint "maxItems" must be non-negative: ${maxItems}`)
  }

  // TODO: implement me!
  void items, minItems, maxItems, uniqueItems
  return <any> null
}
