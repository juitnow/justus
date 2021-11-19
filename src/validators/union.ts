import {
  InferValidationType,
  Validation,
} from '../validation'
import { Validator } from '../validator'

type UnionArguments = readonly [ Validation, ...Validation[] ]

/* -------------------------------------------------------------------------- */

type InferOneOfValidationType<A extends UnionArguments> =
  A extends readonly [ infer First, ...infer Rest ] ?
    First extends Validation ?
      Rest extends UnionArguments ?
        InferValidationType<First> | InferOneOfValidationType<Rest> :
      InferValidationType<First> :
    never :
  never

export class OneOfValidator<A extends UnionArguments> extends Validator<InferOneOfValidationType<A>> {
  constructor(args: A) {
    super()
    void args
  }

  validate(value: unknown): InferOneOfValidationType<A> {
    return <any> value // TODO
  }
}

export function oneOf<A extends UnionArguments>(args: A): OneOfValidator<A> {
  return new OneOfValidator(args)
}

/* -------------------------------------------------------------------------- */

type InferAllOfValidationType<A extends UnionArguments> =
  A extends readonly [ infer First, ...infer Rest ] ?
    First extends Validation ?
      Rest extends UnionArguments ?
        InferValidationType<First> & InferOneOfValidationType<Rest> :
      InferValidationType<First> :
    never :
  never

export class AllOfValidator<A extends UnionArguments> extends Validator<InferAllOfValidationType<A>> {
  constructor(args: A) {
    super()
    void args
  }

  validate(value: unknown): InferAllOfValidationType<A> {
    return <any> value // TODO
  }
}

export function allOf<A extends UnionArguments>(args: A): AllOfValidator<A> {
  return new AllOfValidator(args)
}
