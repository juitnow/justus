import type { Validator } from './validation'

import {
  allowAdditionalProperties,
  InferSchema,
  ObjectValidator,
  Schema,
  SchemaValidator,
} from './schemas'

import { assert, getValidator, isPrimitive, isValidator } from './utilities'

import { any } from './primitives'

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

export function object(): ObjectValidator // <any, undefined>
export function object<S extends Schema>(schema: S): SchemaValidator<InferSchema<S>, S>
export function object(schema: Schema = {}): SchemaValidator<any, Schema> {
  const { [allowAdditionalProperties]: additional = false, ...properties } = schema

  const additionalProperties =
    additional === false ? undefined :
    additional === true ? any :
    getValidator(additional)

  const requiredProperties: Record<string, Validator<any>> = {}
  const optionalProperties: Record<string, Validator<any>> = {}
  const neverProperties: string[] = []

  for (const key of Object.keys(properties)) {
    const definition = properties[key]

    if (isPrimitive(definition)) {
      requiredProperties[key] = getValidator(definition)
    } else if (isValidator(definition)) {
      requiredProperties[key] = getValidator(definition)
    } else if ('modifier' in definition) {
      (definition.optional ? optionalProperties : requiredProperties)[key] = definition.modifier
    } else if ('never' in definition) {
      neverProperties.push(key)
    } else {
      requiredProperties[key] = getValidator(definition)
    }
  }

  return {
    schema,
    validate(value): any {
      assert(typeof value == 'object', 'Value is not an "object"')
      assert(value !== null, 'Value is "null"')

      const clone: Record<string, any> = {}

      for (const key of Object.keys(requiredProperties)) {
        const validator = requiredProperties[key]

        assert(value[key] !== undefined, 'Required value is "undefined"')
        clone[key] = validator.validate(value[key])
      }

      for (const key of Object.keys(optionalProperties)) {
        const validator = requiredProperties[key]

        if (value[key] !== undefined) clone[key] = validator.validate(value[key])
      }

      for (const key of neverProperties) {
        assert(value[key] == undefined, 'Forbidden property found')
      }

      if (additionalProperties) {
        const cloned = Object.keys(clone)
        const keys = Object.keys(value).filter((k) => ! cloned.includes(k))

        keys.filter((k) => value[k] !== undefined)
            .forEach((key) => clone[key] = additionalProperties.validate(value[key]))
      }

      return clone
    },
  }
}
