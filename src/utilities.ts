import { assertSchema } from './errors'
import { registry } from './registry'

import type { Schema, Validation, Validator } from './types'

/* ========================================================================== *
 * UTILITY FUNCTIONS                                                          *
 * ========================================================================== */

/** Return the `Validator` for the given `Validation` */
export function getValidator(validation: Validation): Validator {
  assertSchema(validation !== undefined, 'No validator for undefined validation')

  // Null is a constant
  if (validation === null) return new (registry.get('constant'))(null)

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
      return new (registry.get('constant'))(validation)

    // other objects...
    case 'object':
      // arrays are tuples
      if (Array.isArray(validation)) return new (registry.get('tuple'))(validation)
      // any other object is a schema
      return new (registry.get('object'))(validation as Schema)

    // definitely not one of our types
    default:
      throw new TypeError(`Invalid validation (type=${typeof validation})`)
  }
}
