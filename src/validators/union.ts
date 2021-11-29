import { ValidationErrorBuilder } from '../errors'
import { getValidator } from '../utilities'
import {
  InferValidation,
  Validation,
  ValidationOptions,
  Validator,
} from '../types'

type UnionArguments = readonly [ Validation, ...Validation[] ]

/* -------------------------------------------------------------------------- */

type InferOneOfValidationType<A extends UnionArguments> =
  A extends readonly [ infer First, ...infer Rest ] ?
    First extends Validation ?
      Rest extends UnionArguments ?
        InferValidation<First> | InferOneOfValidationType<Rest> :
      InferValidation<First> :
    never :
  never

/** A `Validator` validating a value as _one of_ the specified arguments. */
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
        builder.record(error)
      }
    }
    return builder.assert(value as InferOneOfValidationType<A>)
  }
}

/** Validate a value as _one of_ the specified arguments */
export function oneOf<A extends UnionArguments>(...args: A): OneOfValidator<A> {
  return new OneOfValidator(args)
}

/* -------------------------------------------------------------------------- */

type InferAllOfValidationType<A extends UnionArguments> =
  A extends readonly [ infer First, ...infer Rest ] ?
    First extends Validation ?
      Rest extends UnionArguments ?
        InferValidation<First> & InferOneOfValidationType<Rest> :
      InferValidation<First> :
    never :
  never

/** A `Validator` validating a value as _all of_ the specified arguments. */
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
    return value as InferAllOfValidationType<A>
  }
}

/** Validate a value as _all of_ the specified arguments */
export function allOf<A extends UnionArguments>(...args: A): AllOfValidator<A> {
  return new AllOfValidator(args)
}
