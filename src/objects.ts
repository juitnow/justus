import { ValidationOptions, Validator } from './validation'

import {
  allowAdditionalProperties,
  InferSchema,
  AdditionalProperties,
  Schema,
} from './schemas'

import { assert, getValidator, isPrimitive, isValidator } from './utilities'

import { AnyValidator } from './primitives'
import { ValidationErrorBuilder } from './errors'
import { AbstractValidator } from './validator'

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

export class ObjectValidator extends AbstractValidator<Record<string, any>>
  implements AdditionalProperties<AnyValidator> {
  [allowAdditionalProperties]: any

  validate(value: unknown): Record<string, any> {
    assert(typeof value == 'object', 'Value is not an "object"')
    assert(value !== null, 'Value is "null"')
    return value
  }
}

export class SchemaValidator<S extends Schema> extends AbstractValidator<InferSchema<S>> {
  readonly schema: S

  #additionalProperties?: Validator
  #requiredProperties: Record<string, Validator<any>> = {}
  #optionalProperties: Record<string, Validator<any>> = {}
  #neverProperties: string[] = []

  constructor(schema: S) {
    super()
    const { [allowAdditionalProperties]: additional, ...properties } = schema

    this.#additionalProperties = additional && getValidator(additional)

    for (const key of Object.keys(properties)) {
      const definition = properties[key]

      if (isPrimitive(definition)) {
        this.#requiredProperties[key] = getValidator(definition)
      } else if (isValidator(definition)) {
        this.#requiredProperties[key] = getValidator(definition)
      } else if ('modifier' in definition) {
        (definition.optional ? this.#optionalProperties : this.#requiredProperties)[key] = definition.modifier
      } else if ('never' in definition) {
        this.#neverProperties.push(key)
      } else {
        this.#requiredProperties[key] = getValidator(definition)
      }
    }

    this.schema = schema
  }

  validate(value: any, options: ValidationOptions): InferSchema<S> {
    assert(typeof value == 'object', 'Value is not an "object"')
    assert(value !== null, 'Value is "null"')

    const builder = new ValidationErrorBuilder(options)
    const clone: Record<string, any> = {}

    for (const key of Object.keys(this.#requiredProperties)) {
      const validator = this.#requiredProperties[key]

      try {
        assert(value[key] !== undefined, 'Required value is "undefined"')
        clone[key] = validator.validate(value[key], options)
      } catch (error) {
        builder.record(key, error)
      }
    }

    for (const key of Object.keys(this.#optionalProperties)) {
      const validator = this.#requiredProperties[key]

      try {
        if (value[key] !== undefined) {
          clone[key] = validator.validate(value[key], options)
        }
      } catch (error) {
        builder.record(key, error)
      }
    }

    for (const key of this.#neverProperties) {
      try {
        assert(value[key] == undefined, 'Forbidden property found')
      } catch (error) {
        builder.record(key, error)
      }
    }

    const cloned = Object.keys(clone)
    const additionalKeys = Object.keys(value).filter((k) => ! cloned.includes(k))
    const additional = this.#additionalProperties

    if (additional) {
      additionalKeys.forEach((key) => {
        if (value[key] === undefined) return
        try {
          clone[key] = additional.validate(value[key], options)
        } catch (error) {
          builder.record(key, error)
        }
      })
    } else {
      additionalKeys.forEach((key) => {
        if (value[key] !== undefined) builder.record(key, 'Unknown property found')
      })
    }

    builder.assert()
    return <any> clone
  }
}

export function object(): ObjectValidator // <any, undefined>
export function object<S extends Schema>(schema: S): SchemaValidator<S>
export function object(schema?: Schema): ObjectValidator | SchemaValidator<Schema> {
  if (! schema) return new ObjectValidator()
  return new SchemaValidator(schema)
}
