import type {
  InferValidationType,
  Validation,
  Validator,
} from './basics'

import {
  getValidator,
  isFunction,
  isPrimitive,
  isValidator,
} from './basics'

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
  const { items, ...constraints } =
    isFunction(options) ? { items: getValidator(options) } :
    isPrimitive(options) ? { items: getValidator(options) } :
    isValidator(options) ? { items: getValidator(options) } :
    { ...options, items: getValidator(options.items) }

  void items, constraints

  // TODO: implement me!
  return <any> null
}
