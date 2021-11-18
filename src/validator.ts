import { tupleRest } from './symbols'
import { TupleRest } from './tuples'
import { ValidationOptions } from './validation'

/**
 * A `Validator` is an object capable of validating a given _value_ and
 * (possibly) converting it the required type `T`.
 *
 * @public
 */
export abstract class Validator<T = any> {
  /**
   * Validate a _value_ and optionally convert it to the required `Type`.
   *
   * @param value - The _value_ to validate
   */
  abstract validate(value: unknown, options: ValidationOptions): T

  * [Symbol.iterator](): Generator<TupleRest<this>> {
    yield { [tupleRest]: this }
  }
}
