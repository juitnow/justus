import { ConstantValidator, nullValidator } from './validators/constant'
import { isValidator, Schema, schemaValidator, Validation, Validator } from './types'
import { TupleValidator } from './validators/tuple'
import { ObjectValidator } from './validators/object'

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

  // Validator instance (either object or function)
  if ((<any> validation)[isValidator] === true) return validation as Validator

  // Other types
  switch (typeof validation) {
    // constants
    case 'boolean':
    case 'string':
    case 'number':
      return new ConstantValidator(validation)

    // other objects...
    case 'object':
      // pre-compiled schema with validator
      if (schemaValidator in validation) return (<any> validation)[schemaValidator]
      // arrays are tuples
      if (Array.isArray(validation)) return new TupleValidator(validation)
      // any other object is a schema
      return new ObjectValidator(validation as Schema)

    // definitely not one of our types
    default:
      throw new TypeError(`Invalid validation (type=${typeof validation})`)
  }
}
