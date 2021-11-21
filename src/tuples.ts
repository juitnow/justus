import { InferValidationType, Validation, ValidationOptions } from './validation'
import { Validator } from './validator'
import { tupleRest } from './symbols'
import { getValidator, isValidation } from './utilities'
import { assert } from './errors'

export type TupleRest<V extends Validator = Validator> = {
  [tupleRest] : V
}

type Tuple =
  readonly TupleRest[] |
  readonly [ Validation, ...Validation[], ...TupleRest[] | never ]

type InferTuple<T extends readonly (Validation | TupleRest)[]> =
  T extends readonly [] ? [] :
  T extends readonly TupleRest<infer V>[] ? InferValidationType<V>[] :
  T extends readonly [ Validation, ...infer Rest ] ?
    Rest extends [] ?
      [ InferValidationType<T[0]> ] :
    Rest extends EnforceTuple<infer Q> ?
      [ InferValidationType<T[0]>, ...InferTuple<Q> ] :
    Rest extends TupleRest<infer V>[] ?
      [ InferValidationType<T[0]>, ...InferValidationType<V>[] ] :
    never :
  never

type EnforceTuple<T extends readonly (Validation | TupleRest)[]> =
  T extends readonly TupleRest[] ? T :
  T extends readonly Validation[] ? T :
  T extends readonly [ infer First, ...infer Rest ] ?
    First extends Validation ?
      Rest extends readonly (Validation | TupleRest)[] ?
        readonly [ First, ...EnforceTuple<Rest> ] :
      never :
    never :
  [ never ]


export class TupleValidator<T extends Tuple> extends Validator<InferTuple<T>> {
  readonly tupleValidators: readonly Validator[]
  readonly restValidator?: Validator

  constructor(tuple: EnforceTuple<T>) {
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

export function tuple<T extends Tuple>(tuple: EnforceTuple<T>): Validator<InferTuple<T>> {
  return new TupleValidator(tuple)
}
