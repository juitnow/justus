import { Validation } from './validation'
import { Validator } from './validator'
import { any } from './validators/any'
import { constant } from './validators/constant'
import { TupleRest } from './tuples'
import { schemaValidator, tupleRest } from './symbols'
import { InferValidationType, tuple } from '.'

/* ========================================================================== *
 * UTILITY FUNCTIONS                                                          *
 * ========================================================================== */

export function makeTupleRestIterable<
  F extends() => Validator,
>(create: F): F & Iterable<TupleRest<InferValidationType<F>>> {
  const validator = create()
  ;(<any>create)[Symbol.iterator] = function* (): Generator<TupleRest<InferValidationType<F>>> {
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

  // Tuples
  if (Array.isArray(validation)) return tuple(validation)

  // TODO: cleanup... here validation can _still_ be a tuple!

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

    // schema validator
    case 'object':
      if (schemaValidator in validation) {
        return (<any>validation)[schemaValidator]
      } else {
        throw new TypeError(`Invalid validation (type=${typeof validation})`)
      }

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
