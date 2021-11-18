import { Validation } from './validation'
import { Validator } from './validator'
import { any } from './validators/any'
import { constant } from './validators/constant'
import { TupleRest } from './tuples'
import { tupleRest } from './symbols'

/* ========================================================================== *
 * UTILITY FUNCTIONS                                                          *
 * ========================================================================== */

export function makeTupleRestIterable<
  F extends(...args: any[]) => Validator,
  V extends Validator,
>(create: F, validator: V): F & Iterable<TupleRest<V>> {
  (<any>create)[Symbol.iterator] = function* (): Generator<TupleRest<V>> {
    yield { [tupleRest]: validator }
  }
  return create as any
}

/**
 * Return the `Validator` for the given `Validation`.
 *
 * When `validation` is `undefined` it will return a `Validator<any>`,
 */
export function getValidator(validation?: Validation): Validator {
  // Undefined maps to `any`, null is a constant
  if (validation === undefined) return any
  if (validation === null) return constant(null)

  // Validator instances are simply returned
  if (validation instanceof Validator) return validation

  // Other types
  switch (typeof validation) {
    // constants
    case 'boolean':
    case 'string':
    case 'number':
      return constant(validation)

    // validator generator
    case 'function':
      return validation()

    // definitely not one of our types
    default:
      throw new TypeError(`Invalid validation (type=${typeof validation})`)
  }
}

export function isValidation(what: any): what is Validation {
  if (what instanceof Validator) return true
  switch (typeof what) {
    case 'function':
    case 'boolean':
    case 'string':
    case 'number':
      return true
    default:
      return what === null
  }
}
