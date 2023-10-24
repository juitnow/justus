import { assertValidation, ValidationErrorBuilder } from '../errors'
import { registry } from '../registry'
import { AbstractValidator, makeValidatorFactory } from '../types'
import { getValidator } from '../utilities'

import type {
  InferInputSchema,
  InferSchema, InferValidation, Schema, TupleRestParameter, Validation,
  ValidationOptions,
  Validator,
} from '../types'

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
export class ObjectValidator<S extends Schema> extends AbstractValidator<InferSchema<S>, InferInputSchema<S>> {
  readonly schema: Readonly<S>

  validators = new Map<string, Validator>()
  additionalProperties?: Validator

  constructor(schema: S) {
    super()
    const { [Symbol.justusAdditionalValidator]: additional, ...properties } = schema

    if (additional) this.additionalProperties = additional

    for (const key of Object.keys(properties)) {
      this.validators.set(key, getValidator(properties[key]))
    }

    this.schema = schema
  }

  validate(value: unknown, options: ValidationOptions = {}): InferSchema<S> {
    assertValidation(typeof value === 'object', 'Value is not an "object"')
    assertValidation(value !== null, 'Value is "null"')

    const { stripAdditionalProperties, stripOptionalNulls } = options

    const record: { [ k in string | number | symbol ]?: unknown } = value
    const builder = new ValidationErrorBuilder()
    const clone: Record<string, any> = {}

    for (const [ key, validator ] of this.validators.entries()) {
      const optional = !! validator.optional
      const original = record[key]

      // strip any optional "null" value if told to do so
      if (stripOptionalNulls && optional && (original === null)) {
        continue
      }

      // if we have no value, then we have few possibilities:
      // - the (optional) validator provides a valid value
      // - the validator is optional, so we can simply ignore
      // - the validator is not optional, so the property is missing
      if (original === undefined) {
        try {
          // try to validate, the validator _might_ be giving us a value
          const validated = validator.validate(original, options)
          // put the validated value in the clone, unless optional and undefined
          if (! (optional && (validated == undefined))) clone[key] = validated
        } catch (error) {
          if (optional) continue // original was undefined, so we can skip!
          builder.record('Required property missing', key)
        }

        continue
      }

      // here value was _not_ undefined, so we have to validate it normally
      try {
        const validated = validator.validate(original, options)
        // put the validated value in the clone, unless optional and undefined
        if (! (optional && (validated == undefined))) clone[key] = validated
      } catch (error) {
        builder.record(error, key)
      }
    }

    // process additional keys, as all keys NOT defined in the schema
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

export function objectFactory<S extends Schema>(schema: S): S & {
  [Symbol.iterator](): Generator<TupleRestParameter<InferSchema<S>, InferInputSchema<S>>>
} {
  const validator = new ObjectValidator(schema)

  function* iterator(): Generator<TupleRestParameter<any, any>> {
    yield { [Symbol.justusRestValidator]: validator }
  }

  return Object.defineProperties(schema, {
    [Symbol.justusValidator]: { value: validator, enumerable: false },
    [Symbol.iterator]: { value: iterator, enumerable: false },
  }) as any
}

/** Validate `object`s. */
export const object = makeValidatorFactory(new AnyObjectValidator(), objectFactory)

/** Validate `Object`s containing only the specified elements. */
export function objectOf<V extends Validation>(validation: V): Validator<Record<string, InferValidation<V>>> {
  return new ObjectValidator({ [Symbol.justusAdditionalValidator]: getValidator(validation) })
}

// Register our "object" validator
registry.set('object', ObjectValidator)
