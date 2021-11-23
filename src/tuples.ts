import { InferValidationType, Validation, ValidationOptions } from './validation'
import { Validator } from './validator'
import { tupleRest } from './symbols'

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
  readonly tuple: T

  constructor(tuple: T) {
    super()
    this.tuple = tuple
  }

  validate(value: unknown, options: ValidationOptions): InferTuple<T> {
    void value, options
    throw new Error('Method not implemented.') // TODO
  }
}

export function tuple<T extends Tuple>(tuple: T): Validator<InferTuple<T>> {
  return new TupleValidator(tuple)
}
