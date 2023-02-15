import { assertSchema, ValidationErrorBuilder } from '../errors'
import {
  AbstractValidator, InferValidation,
  Validation,
  ValidationOptions,
  Validator,
} from '../types'
import { getValidator } from '../utilities'

/* -------------------------------------------------------------------------- */

export type OneOfArguments = readonly Validation[]

export type InferOneOfValidationType<A extends OneOfArguments> =
  A extends readonly [ infer First, ...infer Rest ] ?
    First extends Validation ?
      Rest extends OneOfArguments ?
        InferValidation<First> | InferOneOfValidationType<Rest> :
      InferValidation<First> :
    never :
  A extends readonly (infer Type)[] ?
    Type extends Validation ?
      InferValidation<Type> :
    never :
  never

/** A `Validator` validating a value as _one of_ the specified arguments. */
export class OneOfValidator<A extends OneOfArguments> extends AbstractValidator<InferOneOfValidationType<A>> {
  readonly validators: readonly Validator[]

  constructor(args: A) {
    super()
    this.validators = args.map((validation) => getValidator(validation))
    assertSchema(this.validators.length > 0, 'At least one validation required in "oneOf"')
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
export function oneOf<A extends OneOfArguments>(...args: A): OneOfValidator<A> {
  return new OneOfValidator(args)
}

/* -------------------------------------------------------------------------- */

export type AllOfArguments = readonly [ Validation, ...Validation[] ]

export type InferAllOfValidationType<A extends AllOfArguments> =
  A extends readonly [ infer First, ...infer Rest ] ?
    First extends Validation ?
      Rest extends AllOfArguments ?
        InferValidation<First> & InferAllOfValidationType<Rest> :
      InferValidation<First> :
    never :
  never

/** A `Validator` validating a value as _all of_ the specified arguments. */
export class AllOfValidator<A extends AllOfArguments> extends AbstractValidator<InferAllOfValidationType<A>> {
  readonly validators: readonly Validator[]

  constructor(args: A) {
    super()
    this.validators = args.map((validation) => getValidator(validation))
    assertSchema(this.validators.length > 0, 'At least one validation required in "allOf"')
  }

  validate(value: unknown, options: ValidationOptions): InferAllOfValidationType<A> {
    for (const validator of this.validators) {
      value = validator.validate(value, options)
    }
    return value as InferAllOfValidationType<A>
  }
}

/** Validate a value as _all of_ the specified arguments */
export function allOf<A extends AllOfArguments>(...args: A): AllOfValidator<A> {
  return new AllOfValidator(args)
}
