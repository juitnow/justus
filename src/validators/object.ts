import {
  InferSchema,
  Schema,
  TupleRestParameter,
  ValidationOptions,
  Validator,
  AbstractValidator,
  additionalValidator,
  restValidator,
  schemaValidator,
  makeValidatorFactory,
} from '../types'
import { assertValidation, ValidationErrorBuilder } from '../errors'
import { getValidator } from '../utilities'

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

/** A `Validator` validating any `object`. */
export class AnyObjectValidator extends AbstractValidator<Record<string, any>> {
  validate(value: unknown): Record<string, any> {
    assertValidation(typeof value == 'object', 'Value is not an "object"')
    assertValidation(value !== null, 'Value is "null"')
    return value
  }
}

/** A `Validator` validating `object`s according to a `Schema`. */
export class ObjectValidator<S extends Schema> extends AbstractValidator<InferSchema<S>> {
  readonly schema: Readonly<S>

  validators = new Map<string, Validator>()
  additionalProperties?: Validator

  constructor(schema: S) {
    super()
    const { [additionalValidator]: additional, ...properties } = schema

    if (additional) this.additionalProperties = getValidator(additional)

    for (const key of Object.keys(properties)) {
      this.validators.set(key, getValidator(properties[key]))
    }

    this.schema = schema
  }

  validate(value: unknown, options: ValidationOptions): InferSchema<S> {
    assertValidation(typeof value === 'object', 'Value is not an "object"')
    assertValidation(value !== null, 'Value is "null"')

    const { stripAdditionalProperties, stripOptionalNulls } = options

    const record: { [ k in string | number | symbol ]?: unknown } = value
    const builder = new ValidationErrorBuilder()
    const clone: Record<string, any> = {}

    for (const [ key, validator ] of this.validators.entries()) {
      const optional = !! validator.optional

      // no value? might be optional, but definitely not validated
      if (record[key] === undefined) {
        if (! optional) builder.record('Required property missing', key)
        continue
      }

      // strip any optional "null" value if told to do so
      if (stripOptionalNulls && optional && (record[key] === null)) {
        continue
      }

      // all the rest gets validated normally
      try {
        const value = validator.validate(record[key], options)
        if (! (optional && (value == undefined))) clone[key] = value
      } catch (error) {
        builder.record(error, key)
      }
    }

    const additionalKeys = Object.keys(record).filter((k) => !this.validators.has(k))
    const additional = this.additionalProperties

    if (additional) {
      additionalKeys.forEach((key) => {
        if (record[key] === undefined) return
        try {
          clone[key] = additional.validate(record[key], options)
        } catch (error) {
          builder.record(error, key)
        }
      })
    } else if (! stripAdditionalProperties) {
      additionalKeys.forEach((key) => {
        if (record[key] !== undefined) builder.record('Unknown property', key)
      })
    }

    return builder.assert(clone as InferSchema<S>)
  }
}

export function _object<S extends Schema>(schema: S): S & {
  [Symbol.iterator](): Generator<TupleRestParameter<InferSchema<S>>>
} {
  const validator = new ObjectValidator(schema)
  function* iterator(): Generator<TupleRestParameter> {
    yield { [restValidator]: validator }
  }

  return Object.defineProperties(schema, {
    [schemaValidator]: { value: validator, enumerable: false },
    [Symbol.iterator]: { value: iterator, enumerable: false },
  }) as any
}

/** Validate `object`s. */
export const object = makeValidatorFactory(new AnyObjectValidator(), _object)
