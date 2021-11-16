import { AdditionalProperties, InferSchema, Schema, allowAdditionalProperties } from './schemas'
import { AnyValidator, any } from './primitives'
import { ValidationErrorBuilder } from './errors'
import { ValidationOptions } from './validation'
import { Validator } from './validator'
import { assert } from './errors'
import { getValidator, isPrimitive } from './utilities'

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

export class ObjectValidator extends Validator<Record<string, any>>
  implements AdditionalProperties<AnyValidator> {
  [allowAdditionalProperties] = any

  validate(value: unknown): Record<string, any> {
    assert(typeof value == 'object', 'Value is not an "object"')
    assert(value !== null, 'Value is "null"')
    return value
  }
}

export class SchemaValidator<S extends Schema> extends Validator<InferSchema<S>> {
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
      } else if (definition instanceof Validator) {
        this.#requiredProperties[key] = definition
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
    } else if (! options.stripAdditionalProperties) {
      additionalKeys.forEach((key) => {
        if (value[key] !== undefined) builder.record(key, 'Unknown property found')
      })
    }

    builder.assert()
    return <any> clone
  }
}

export function object(): ObjectValidator
export function object<S extends Schema>(schema: S): SchemaValidator<S>
export function object(schema?: Schema): ObjectValidator | SchemaValidator<Schema> {
  return schema ? new SchemaValidator(schema) : new ObjectValidator()
}
