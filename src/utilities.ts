import { ConstantValidator, nullValidator } from './validators/constant'
// eslint-disable-next-line import/no-cycle
import { ObjectValidator } from './validators/object'
// eslint-disable-next-line import/no-cycle
import { TupleValidator } from './validators/tuple'

import type { Schema, Validation, Validator } from './types'

/* ========================================================================== *
 * UTILITY FUNCTIONS                                                          *
 * ========================================================================== */

/**
 * Return the `Validator` for the given `Validation`.
 *
 * When `validation` is `undefined` it will return a `Validator<any>`,
 */
export function getValidator(validation: Validation): Validator {
  // Null is a constant
  if (validation === null) return nullValidator

  // Anything with a validor associated with
  if ((<any> validation)[Symbol.justusValidator]) {
    return (<any> validation)[Symbol.justusValidator] as Validator
  }

  // Other types
  switch (typeof validation) {
    // constants
    case 'boolean':
    case 'string':
    case 'number':
      return new ConstantValidator(validation)

    // other objects...
    case 'object':
      // arrays are tuples
      if (Array.isArray(validation)) return new TupleValidator(validation)
      // any other object is a schema
      return new ObjectValidator(validation as Schema)

    // definitely not one of our types
    default:
      throw new TypeError(`Invalid validation (type=${typeof validation})`)
  }
}
