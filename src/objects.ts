import { InferSchema, Schema, additionalProperties } from './schemas'
import { assert, ValidationError, ValidationErrorBuilder } from './errors'
import { ValidationOptions } from './validation'
import { Validator } from './validator'
import { getValidator, isValidation } from './utilities'

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

export class ObjectValidator<S extends Schema> extends Validator<InferSchema<S>> {
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

      if (isValidation(definition)) {
        this.#requiredProperties[key] = getValidator(definition)
      } else if ('modifier' in definition) {
        (definition.optional ? this.#optionalProperties : this.#requiredProperties)[key] = definition.modifier
      } else if ('never' in definition) {
        this.#neverProperties.add(key)
      } else {
        assert(false, `Invalid property in schema for key "${key}"`)
      }
    }

    this.schema = schema
  }

  validate(value: unknown, options: ValidationOptions): InferSchema<S> {
    ValidationError.assert(typeof value === 'object', 'Value is not an "object"')
    ValidationError.assert(value !== null, 'Value is "null"')

    const record: { [ k in string | number | symbol ]?: unknown } = value
    const builder = new ValidationErrorBuilder()
    const clone: Record<string, any> = {}

    for (const [ key, validator ] of Object.entries(this.#requiredProperties)) {
      if (record[key] === undefined) {
        builder.record(key, 'Required property missing')
        continue
      }

      try {
        clone[key] = validator.validate(record[key], options)
      } catch (error) {
        builder.record(key, error)
      }
    }

    for (const [ key, validator ] of Object.entries(this.#optionalProperties)) {
      if (record[key] === undefined) continue

      try {
        clone[key] = validator.validate(record[key], options)
      } catch (error) {
        builder.record(key, error)
      }
    }

    for (const key of this.#neverProperties) {
      if (record[key] === undefined) continue
      if (options.stripForbiddenProperties) continue
      builder.record(key, 'Forbidden property')
    }

    const additional = this.#additionalProperties
    const additionalKeys = Object.keys(record).filter((k) => {
      if (k in this.#requiredProperties) return false
      if (k in this.#optionalProperties) return false
      if (this.#neverProperties.has(k)) return false
      return true
    })

    if (additional) {
      additionalKeys.forEach((key) => {
        if (record[key] === undefined) return
        try {
          clone[key] = additional.validate(record[key], options)
        } catch (error) {
          builder.record(key, error)
        }
      })
    } else if (! options.stripAdditionalProperties) {
      additionalKeys.forEach((key) => {
        if (record[key] !== undefined) builder.record(key, 'Unknown property')
      })
    }

    builder.assert()
    return <any> clone
  }
}

const anyObjectValidator = new class extends Validator<Record<string, any>> {
  validate(value: unknown): Record<string, any> {
    ValidationError.assert(typeof value == 'object', 'Value is not an "object"')
    ValidationError.assert(value !== null, 'Value is "null"')
    return value
  }
}


export function object(): Validator<Record<string, any>>
export function object<S extends Schema>(schema: S): ObjectValidator<S>
export function object(schema?: Schema): Validator<Record<string, any>> | ObjectValidator<Schema> {
  return schema ? new ObjectValidator(schema) : anyObjectValidator
}
