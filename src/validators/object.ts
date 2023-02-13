import {
  InferSchema,
  Schema,
  TupleRestParameter,
  ValidationOptions,
  Validator,
  AbstractValidator,
  additionalValidator,
  modifierValidator,
  never,
  restValidator,
  schemaValidator,
  makeValidatorFactory,
} from '../types'
import { assertValidation, ValidationErrorBuilder } from '../errors'
import { getValidator } from '../utilities'
import { isModifier } from '../schema'

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

export type ObjectProperty = {
  validator: Validator,
  readonly?: true,
  optional?: true,
}

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

  properties = new Map<string, ObjectProperty | undefined>()
  additionalProperties?: Validator

  constructor(schema: S) {
    super()
    const { [additionalValidator]: additional, ...properties } = schema

    if (additional) this.additionalProperties = getValidator(additional)

    for (const key of Object.keys(properties)) {
      const definition = properties[key]

      if (definition === never) {
        this.properties.set(key, undefined)
      } else if (isModifier(definition)) {
        this.properties.set(key, {
          validator: definition[modifierValidator],
          readonly: definition.readonly,
          optional: definition.optional,
        })
      } else {
        this.properties.set(key, { validator: getValidator(definition) })
      }
    }

    this.schema = schema
  }

  validate(value: unknown, options: ValidationOptions): InferSchema<S> {
    assertValidation(typeof value === 'object', 'Value is not an "object"')
    assertValidation(value !== null, 'Value is "null"')

    const { stripAdditionalProperties, stripForbiddenProperties, stripOptionalNulls } = options

    const record: { [ k in string | number | symbol ]?: unknown } = value
    const builder = new ValidationErrorBuilder()
    const clone: Record<string, any> = {}

    for (const [ key, property ] of this.properties.entries()) {
      const { validator, optional } = property || {}

      // no validator? this is "never" (forbidden)
      if (! validator) {
        if (record[key] === undefined) continue
        if (stripForbiddenProperties) continue
        builder.record('Forbidden property', key)
        continue
      }

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
        clone[key] = validator.validate(record[key], options)
      } catch (error) {
        builder.record(error, key)
      }
    }

    const additionalKeys = Object.keys(record).filter((k) => !this.properties.has(k))
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

const anyObjectValidator = new AnyObjectValidator()

export function _object(): Validator<Record<string, any>>
export function _object<S extends Schema>(schema: S): S & {
  [Symbol.iterator](): Generator<TupleRestParameter<InferSchema<S>>>
}
export function _object(schema?: Schema): Validator<Record<string, any>> | Schema {
  if (! schema) return anyObjectValidator

  const validator = new ObjectValidator(schema)
  function* iterator(): Generator<TupleRestParameter> {
    yield { [restValidator]: validator }
  }

  return Object.defineProperties(schema, {
    [schemaValidator]: { value: validator, enumerable: false },
    [Symbol.iterator]: { value: iterator, enumerable: false },
  })
}

/** Validate `object`s. */
export const object = makeValidatorFactory(anyObjectValidator, _object)
