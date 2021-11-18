import { InferValidationType, Validation } from './validation'
import { Validator } from './validator'
import { tupleRest } from './symbols'

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

export function tuple<T extends Tuple>(tuple: EnforceTuple<T>): Validator<InferTuple<T>> {
  // TODO
  return <any> tuple
}
