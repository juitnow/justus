import { additionalValidator, InferSchema, modifierValidator, never, Schema, schemaValidator, ValidationOptions, Validator } from '../types'
import { assertValidation, ValidationErrorBuilder } from '../errors'
import { getValidator } from '../utilities'
import { isModifier } from '../schema'
import { makeTupleRestIterable } from './tuple'

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
    const { [additionalValidator]: additional, ...properties } = schema

    if (additional) this.#additionalProperties = getValidator(additional)

    for (const key of Object.keys(properties)) {
      const definition = properties[key]

      if (definition === never) {
        this.#neverProperties.add(key)
      } else if (isModifier(definition)) {
        (definition.optional ? this.#optionalProperties : this.#requiredProperties)[key] = definition[modifierValidator]
      } else {
        this.#requiredProperties[key] = getValidator(definition)
      }
    }

    this.schema = schema
  }

  validate(value: unknown, options: ValidationOptions): InferSchema<S> {
    assertValidation(typeof value === 'object', 'Value is not an "object"')
    assertValidation(value !== null, 'Value is "null"')

    const record: { [ k in string | number | symbol ]?: unknown } = value
    const builder = new ValidationErrorBuilder()
    const clone: Record<string, any> = {}

    for (const [ key, validator ] of Object.entries(this.#requiredProperties)) {
      if (record[key] === undefined) {
        builder.record('Required property missing', key)
        continue
      }

      try {
        clone[key] = validator.validate(record[key], options)
      } catch (error) {
        builder.record(error, key)
      }
    }

    for (const [ key, validator ] of Object.entries(this.#optionalProperties)) {
      if (record[key] === undefined) continue

      try {
        clone[key] = validator.validate(record[key], options)
      } catch (error) {
        builder.record(error, key)
      }
    }

    for (const key of this.#neverProperties) {
      if (record[key] === undefined) continue
      if (options.stripForbiddenProperties) continue
      builder.record('Forbidden property', key)
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
          builder.record(error, key)
        }
      })
    } else if (! options.stripAdditionalProperties) {
      additionalKeys.forEach((key) => {
        if (record[key] !== undefined) builder.record('Unknown property', key)
      })
    }

    return builder.assert(clone as InferSchema<S>)
  }
}

const anyObjectValidator = new class extends Validator<Record<string, any>> {
  validate(value: unknown): Record<string, any> {
    assertValidation(typeof value == 'object', 'Value is not an "object"')
    assertValidation(value !== null, 'Value is "null"')
    return value
  }
}


function _object(): Validator<Record<string, any>>
function _object<S extends Schema>(schema: S): Readonly<S>
function _object(schema?: Schema): Validator<Record<string, any>> | Readonly<Schema> {
  if (! schema) return anyObjectValidator

  const validator = new ObjectValidator(schema)
  const validation: Schema = {
    [additionalValidator]: schema[additionalValidator],
  }

  for (const key of Object.keys(schema)) validation[key] = schema[key]

  Object.defineProperty(validation, schemaValidator, { enumerable: false, value: validator })

  return Object.freeze(validation)
}

export const object = makeTupleRestIterable(_object)
