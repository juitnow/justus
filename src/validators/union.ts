import { ValidationErrorBuilder } from '../errors'
import { getValidator } from '../utilities'
import {
  InferValidationType,
  Validation,
  ValidationOptions,
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
  readonly validators: readonly Validator[]

  constructor(args: A) {
    super()
    this.validators = args.map((validation) => getValidator(validation))
  }

  validate(value: unknown, options: ValidationOptions): InferOneOfValidationType<A> {
    const builder = new ValidationErrorBuilder()
    for (const validator of this.validators) {
      try {
        return validator.validate(value, options)
      } catch (error) {
        builder.record(undefined, error)
      }
    }
    builder.assert()
    return <any> value
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
  readonly validators: readonly Validator[]

  constructor(args: A) {
    super()
    this.validators = args.map((validation) => getValidator(validation))
  }

  validate(value: unknown, options: ValidationOptions): InferAllOfValidationType<A> {
    for (const validator of this.validators) {
      value = validator.validate(value, options)
    }
    return <any> value
  }
}

export function allOf<A extends UnionArguments>(args: A): AllOfValidator<A> {
  return new AllOfValidator(args)
}
