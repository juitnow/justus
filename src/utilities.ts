import { any } from './validators/any'
import { ConstantValidator, nullValidator } from './validators/constant'
import { Schema, schemaValidator, Validation, Validator } from './types'
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
export function getValidator(validation?: Validation): Validator {
  // Undefined maps to `any`, null is a constant
  if (validation === undefined) return any
  if (validation === null) return nullValidator

  // Validator instances are simply returned
  if (validation instanceof Validator) return validation

  // Other types
  switch (typeof validation) {
    // constants
    case 'boolean':
    case 'string':
    case 'number':
      return new ConstantValidator(validation)

    // validator generator
    case 'function':
      return validation()

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
