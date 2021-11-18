import { boolean, string } from './primitives'
import { InferValidationType, Validation } from './validation'
import { Validator } from './validator'

type TupleExtender<V extends Validator = Validator> = {
  many: true,
  vali: V,
}

type DDD = TupleExtender<Validator<Date>>
const date = { * [Symbol.iterator](): Generator<DDD, void, unknown> { } }

type EEE = TupleExtender<Validator<Error>>
const err = { * [Symbol.iterator](): Generator<EEE, void, unknown> { } }

type InferTuple<T extends readonly (Validation | TupleExtender)[]> =
  T extends readonly [] ?
    [] :
  T extends readonly TupleExtender<infer V>[] ?
    InferValidationType<V>[] :
  T extends readonly [ Validation, ...infer Rest ] ?
    Rest extends [] ?
      [ InferValidationType<T[0]> ] :
    Rest extends Tuple<infer Q> ?
      [ InferValidationType<T[0]>, ...InferTuple<Q> ] :
    Rest extends TupleExtender<infer V>[] ?
      [ InferValidationType<T[0]>, ...InferValidationType<V>[] ] :
    never :
  never

type Tuple<T extends readonly (Validation | TupleExtender)[]> =
  T extends readonly TupleExtender[] ? T :
  T extends readonly Validation[] ? T :
  T extends readonly [ infer First, ...infer Rest ] ?
    First extends Validation ?
      Rest extends readonly (Validation | TupleExtender)[] ?
        readonly [ First, ...Tuple<Rest> ] :
      never :
    never :
  [ never ]

export function tuple<T extends TupleXX>(tuple: Tuple<T>): InferTuple<T> {
  void tuple
  return <any> null
}

type OOO = {
  [ k: string ]: TupleXX,
}

type III<T extends OOO> = {
  [ k in keyof T ] : InferTuple<T[k]>
}

const a0a = tuple([ 'ff', 123, 'abc' ])
const a1a = tuple([ 1, 'fooo', 123, ...date ])
const a2a = tuple([ boolean, string, ...date ])
const a3a = tuple([ 'foo', 123, ...date, boolean ])
const a4a = tuple([ ...date ])
const a5a = tuple([])

const a0b = tuple([ 'ff', 123, 'abc' ] as const)
const a1b = tuple([ 1, 'fooo', 123, ...date ] as const)
const a2b = tuple([ boolean, string, ...date ] as const)
const a3b = tuple([ 'foo', 123, ...date, boolean ] as const)
const a4b = tuple([ ...date ] as const)
const a5b = tuple([] as const)

const ooo = {
  a0a: [ 'ff', 123, 'abc' ],
  a1a: [ 1, 'fooo', 123, ...date ],
  a2a: [ boolean, string, ...date ],
  a3a: [ 'foo', 123, ...date, boolean ],
  a4a: [ ...date ],
  a5a: [ ],
} as const

function fff<T extends OOO>(ooo: T): III<T> {
  return <any> ooo
}

const iii = fff(ooo)
iii.a0a
iii.a1a
iii.a2a
iii.a3a
iii.a4a
iii.a5a

void a0a, a1a, a2a, a3a, a4a
void a0b, a1b, a2b, a3b, a4b

// export class TupleValidator<T extends Tuple> extends Validator<InferTuple<T>> {
//   constructor(tuple: T) {
//     super()
//     void tuple
//   }

//   validate(value: unknown): InferTuple<T> {
//     void value
//     throw new Error('Method not implemented.')
//   }
// }

// THIS IS OK
// export function tuple<T extends Tuple>(tuple: T): TupleValidator<T> {
//   return new TupleValidator(tuple)
// }


type TupleXX = readonly TupleExtender[] |
  readonly [ Validation, ...Validation[], ...TupleExtender[] | never ]


// const qqq = [ ...date, 'X', ...date, 'Y', ...date ] as const

const tA = tuple([ ...date ])
const qA = tA.validate(null)

const tX = tuple([ 1, 'a', boolean, ...date ])
const qX = tX.validate(null)

const tY = tuple([ 1, 'a', ...date, boolean, ...err ] as const)
const qY = tY.validate(null)

const tQ = tuple([ 1, 'a', ...date, boolean ] as const)
const qQ = tQ.validate(null)

const tZ = tuple([ 1, 'a', string ])
const qZ = tZ.validate(null)
