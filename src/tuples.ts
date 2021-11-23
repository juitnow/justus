import { InferValidationType, Validation, ValidationOptions } from './validation'
import { Validator } from './validator'
import { tupleRest } from './symbols'
import { getValidator, isValidation } from './utilities'
import { assert } from './errors'

export type TupleRest<V extends Validator = Validator> = {
  [tupleRest] : V
}

export type Tuple = readonly (Validation | TupleRest)[]

type InferValidationOrTupleRest<T> =
  T extends TupleRest<Validator<infer V>> ? V :
  T extends Validation ? InferValidationType<T> :
  never

export type InferTuple<T> =
  T extends Tuple ?
    T extends readonly [] ? [] :
    T extends readonly [ Validation, ...any[] ] ?
      T extends readonly [ infer V, ...infer Rest ] ?
        [ InferValidationType<V>, ...InferTuple<Rest> ] :
      never :
    T extends readonly [ ...any[], Validation ] ?
      T extends readonly [ ...infer Rest, infer V ] ?
        [ ...InferTuple<Rest>, InferValidationType<V> ] :
      never :
    T extends readonly (infer V)[] ?
      [ ...InferValidationOrTupleRest<V>[] ] :
    never :
  never


export class TupleValidator<T extends Tuple> extends Validator<InferTuple<T>> {
  readonly tupleValidators: readonly Validator[]
  readonly restValidator?: Validator

  constructor(tuple: T) {
    super()

    const tupleValidators: Validator[] = []

    for (let i = 0; i < tuple.length; i++) {
      const item = tuple[i]

      if (isValidation(item)) {
        tupleValidators.push(getValidator(item))
      } else if (tupleRest in item) {
        if (i == (tuple.length - 1)) {
          this.restValidator = item[tupleRest]
        } else {
          assert(false, '') // TODO
        }
      } else {
        assert(false, '') // TODO
      }
    }

    this.tupleValidators = tupleValidators
  }

  validate(value: unknown, options: ValidationOptions): InferTuple<T> {
    void value, options
    throw new Error('Method not implemented.') // TODO
  }
}

export function tuple<T extends Tuple>(tuple: T): Validator<InferTuple<T>> {
  return new TupleValidator(tuple)
}

const q = tuple([ 'foo' ] as const)
void q
