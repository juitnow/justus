import { InferValidationType, Validation, ValidationOptions } from './validation'
import { ValidationErrorBuilder } from './errors'
import { Validator } from './validator'
import { assert } from './errors'
import { getValidator, isFunction, isPrimitive } from './utilities'
import { ValidationError } from '.'

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

export class ArrayValidator<V extends Validation> extends Validator<InferValidationType<V>[]> {
  #maxItems: number
  #minItems: number
  #uniqueItems: boolean
  #items: Validator<V>

  constructor()
  constructor(validation: V)
  constructor(constraints: ArrayConstraints<V>)
  constructor(options: Validation | ArrayConstraints<Validation> = {}) {
    super()

    const {
      items,
      maxItems = Number.POSITIVE_INFINITY,
      minItems = 0,
      uniqueItems = false,
    } =
      options instanceof Validator ? { items: options } :
      isFunction(options) ? { items: getValidator(options) } :
      isPrimitive(options) ? { items: getValidator(options) } :
      { ...options, items: getValidator(options.items) }

    assert(minItems >= 0, `Constraint "minItems" (${minItems}) must be non-negative`)
    assert(maxItems >= 0, `Constraint "maxItems" (${maxItems}) must be non-negative`)
    assert(minItems <= maxItems, `Constraint "minItems" (${minItems}) is greater than "maxItems" (${maxItems})`)

    this.#items = items
    this.#maxItems = maxItems
    this.#minItems = minItems
    this.#uniqueItems = uniqueItems
  }

  validate(value: any, options: ValidationOptions): InferValidationType<V>[] {
    ValidationError.assert(Array.isArray(value), 'Value is not an "array"')

    ValidationError.assert(value.length >= this.#minItems,
        `Array must have a minimum length of ${this.#minItems}`)

    ValidationError.assert(value.length <= this.#maxItems,
        `Array must have a maximum length of ${this.#maxItems}`)

    const builder = new ValidationErrorBuilder(options)
    const clone: any[] = new Array(value.length)

    value.forEach((item, i) => {
      try {
        const position = value.indexOf(value[i])
        if (position === i) {
          this.#items.validate(item, options)
        } else if (this.#uniqueItems) {
          builder.record(i, `Duplicate of item at index ${position}`)
        }
        clone[i] = item
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
export function array<V extends Validation>(validation: V): ArrayValidator<InferValidationType<V>>
export function array<V extends Validation>(constraints: ArrayConstraints<V>): ArrayValidator<InferValidationType<V>>

export function array(options?: Validation | ArrayConstraints<Validation>): ArrayValidator<Validation> {
  return new ArrayValidator(<any> options)
}
