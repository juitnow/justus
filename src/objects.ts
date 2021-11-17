import { AdditionalProperties, InferSchema, Schema, additionalProperties } from './schemas'
import { AnyValidator, any } from './primitives'
import { ValidationError, ValidationErrorBuilder } from './errors'
import { ValidationOptions } from './validation'
import { Validator } from './validator'
import { getValidator, isPrimitive } from './utilities'

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

export class ObjectValidator extends Validator<Record<string, any>>
  implements AdditionalProperties<AnyValidator> {
  [additionalProperties] = any

  validate(value: unknown): Record<string, any> {
    ValidationError.assert(typeof value == 'object', 'Value is not an "object"')
    ValidationError.assert(value !== null, 'Value is "null"')
    return value
  }
}

export class SchemaValidator<S extends Schema> extends Validator<InferSchema<S>> {
  readonly schema: S

  #additionalProperties?: Validator
  #requiredProperties: Record<string, Validator<any>> = {}
  #optionalProperties: Record<string, Validator<any>> = {}
  #neverProperties: Set<string> = new Set<string>()

  constructor(schema: S) {
    super()
    const { [additionalProperties]: additional, ...properties } = schema

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
        this.#neverProperties.add(key)
      } else {
        this.#requiredProperties[key] = getValidator(definition)
      }
    }

    this.schema = schema
  }

  validate(value: any, options: ValidationOptions): InferSchema<S> {
    ValidationError.assert(typeof value == 'object', 'Value is not an "object"')
    ValidationError.assert(value !== null, 'Value is "null"')

    const builder = new ValidationErrorBuilder()
    const clone: Record<string, any> = {}

    for (const [ key, validator ] of Object.entries(this.#requiredProperties)) {
      if (value[key] === undefined) {
        builder.record(key, 'Required property missing')
        continue
      }

      try {
        clone[key] = validator.validate(value[key], options)
      } catch (error) {
        builder.record(key, error)
      }
    }

    for (const [ key, validator ] of Object.entries(this.#optionalProperties)) {
      if (value[key] === undefined) continue

      try {
        clone[key] = validator.validate(value[key], options)
      } catch (error) {
        builder.record(key, error)
      }
    }

    for (const key of this.#neverProperties) {
      if (value[key] === undefined) continue
      if (options.stripForbiddenProperties) continue
      builder.record(key, 'Forbidden property')
    }

    const additional = this.#additionalProperties
    const additionalKeys = Object.keys(value).filter((k) => {
      if (k in this.#requiredProperties) return false
      if (k in this.#optionalProperties) return false
      if (this.#neverProperties.has(k)) return false
      return true
    })

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
        if (value[key] !== undefined) builder.record(key, 'Unknown property')
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
