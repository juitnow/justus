import {
  AllOfValidator,
  AnyArrayValidator,
  AnyNumberValidator,
  AnyObjectValidator,
  AnyStringValidator,
  AnyValidator,
  ArrayValidator,
  BooleanValidator,
  ConstantValidator,
  DateValidator,
  NumberValidator,
  ObjectValidator,
  OneOfValidator,
  StringValidator,
  TupleValidator,
  Validation,
  Validator,
  assertSchema,
  getValidator,
} from './index'

/* ========================================================================== *
 * LOCAL TYPES                                                                *
 * ========================================================================== */

/** A function taking a `Validator` and producing its `TypeNode`. */
type JSONGenerator<V extends Validator = Validator> = (
  validator: V,
  references: ReadonlyMap<Validator, string>
) => Record<string, any>

/** The generic constructor of a `Validator` instance. */
type ValidatorConstructor<V extends Validator = Validator> = { // <T = any> = {
  new (...args: any[]): V
}

/* ========================================================================== *
 * GENERATE TYPES FOR VALIDATORS                                              *
 * ========================================================================== */

/** Registry of all `Validator` constructors and related `TypeGenerator`s. */
const generators = new Map<Function, JSONGenerator<any>>()

export function registerJSONGenerator<V extends Validator>(
    validator: ValidatorConstructor<V>,
    generator: JSONGenerator<V>,
): void {
  assertSchema(validator.prototype instanceof Validator, 'Not a `Validator` class')
  generators.set(validator, generator)
}

/** Generate the JSON schema for the given `Validation`. */
export function generateJSON(
    validation: Validation,
    definitions: Record<string, Validation> = {},
): Record<string, any> {
  // Create two maps (one mapping "string -> validator" and another mapping
  // "validator -> string"). The first map will serve as our "definitions" map,
  // while the second will make sure that any defined validator gets referenced
  // in the generated JSON schema, rather than being re-generated
  const validators = new Map<string, Validator>()
  const references = new Map<Validator, string>()

  Object.entries(definitions).forEach(([ name, validation ]) => {
    const validator = getValidator(validation)
    // References will be added only once, first one takes precedence!
    if (! references.has(validator)) references.set(validator, name)
    validators.set(name, validator)
  })

  // Create our JSON schema's "$defs"
  const $defs: Record<string, any> = {}
  for (const [ name, validator ] of validators.entries()) {
    $defs[name] = generate(validator, references)
  }

  // Create the JSON schema for the main validation
  const schema = generate(getValidator(validation), references)
  if (Object.keys($defs).length) schema.$defs = $defs
  return JSON.parse(JSON.stringify(schema)) // remove all undefined
}

/* ========================================================================== *
 * TYPE GENERATORS                                                            *
 * ========================================================================== */

function generate(
    validator: Validator,
    references: ReadonlyMap<Validator, string>,
): Record<string, any> {
  const reference = references.get(validator)
  if (reference) return { $ref: `#/$defs/${reference}` }

  const generator = generators.get(validator.constructor)
  assertSchema(!! generator, `Type generator for "${validator.constructor.name}" not found`)
  return generator(validator, references)
}

/* ========================================================================== */

// Simple schemas

registerJSONGenerator(AnyValidator, () => ({}))
registerJSONGenerator(AnyArrayValidator, () => ({ type: 'array' }))
registerJSONGenerator(AnyNumberValidator, () => ({ type: 'number' }))
registerJSONGenerator(AnyObjectValidator, () => ({ type: 'object' }))
registerJSONGenerator(AnyStringValidator, () => ({ type: 'string' }))
registerJSONGenerator(BooleanValidator, () => ({ type: 'boolean' }))

/* ========================================================================== */

// Arrays

registerJSONGenerator(ArrayValidator, ({
  minItems,
  maxItems,
  uniqueItems,
  items,
}, references) => ({
  type: 'array',
  minItems: minItems == 0 ? undefined : minItems,
  maxItems: maxItems == Number.POSITIVE_INFINITY ? undefined : maxItems,
  uniqueItems: uniqueItems ? uniqueItems : undefined,
  items: generate(items, references),
}))

/* ========================================================================== */

// Constants

registerJSONGenerator(ConstantValidator, ({ constant }) => ({ const: constant }))

/* ========================================================================== */

// Dates

const isoDate = ({ from, until }: { from?: Date, until?: Date }): Record<string, any> => ({
  type: 'string',
  format: 'date-time',
  __from: assertSchema(from === undefined, 'Date "from" validation available only when format is "timestamp"'),
  __until: assertSchema(until === undefined, 'Date "until" validation available only when format is "timestamp"'),
})

const timestampDate = ({ from, until }: { from?: Date, until?: Date }): Record<string, any> => ({
  type: 'number',
  maximum: until ? until.getTime() : 8640000000000000,
  minimum: from ? from.getTime() : -8640000000000000,
})

registerJSONGenerator(DateValidator, ({ format, ...constraints }) =>
  format === 'iso' ? isoDate(constraints) :
  format === 'timestamp' ? timestampDate(constraints) :
  { oneOf: [ isoDate(constraints), timestampDate(constraints) ] })

/* ========================================================================== */

// Numbers

registerJSONGenerator(NumberValidator, ({
  maximum,
  minimum,
  exclusiveMaximum,
  exclusiveMinimum,
  multipleOf,
}) => ({
  maximum,
  minimum,
  exclusiveMaximum,
  exclusiveMinimum,
  multipleOf,
}))

/* ========================================================================== */

// Strings

registerJSONGenerator(StringValidator, ({
  maxLength,
  minLength,
  pattern,
}) => ({
  maxLength,
  minLength,
  pattern: pattern?.toString(),
}))

/* ========================================================================== */

// Unions

registerJSONGenerator(AllOfValidator, ({ validators }, references) =>
  ({ allOf: validators.map((validator) => generate(validator, references)) }))

registerJSONGenerator(OneOfValidator, ({ validators }, references) =>
  ({ anyOf: validators.map((validator) => generate(validator, references)) }))

/* ========================================================================== */

// Tuples

registerJSONGenerator(TupleValidator, ({ members }, references) => {
  // Map all members as "prefixItems" and verify that only the last can be rest
  const prefixItems: Record<string, any>[] = members.map((member, i) => {
    if (member.single) return generate(member.validator, references)
    assertSchema(i === (members.length - 1), 'Rest parameter must be last in JSON schema')
  }).filter((json) => !! json) as Record<string, any>[]

  // Get the last element
  const last = members[members.length - 1]

  // Return our JSON tuple
  return {
    type: 'array',
    prefixItems,
    items: last?.single ? undefined : generate(last.validator, references),
  }
})

/* ========================================================================== */

// Objects

registerJSONGenerator(ObjectValidator, (validator, references) => {
  const { properties: props, additionalProperties: add } = validator

  const requiredProperties: string[] = []
  const properties: Record<string, any> = {}

  props.forEach((property, key) => {
    const { validator, optional } = property || {}
    if (! validator) return // never defineProperties

    properties[key] = generate(validator, references)
    if (! optional) requiredProperties.push(key)
  })

  const additionalProperties = add ? generate(add, references) : false

  return {
    type: 'object',
    properties,
    requiredProperties,
    additionalProperties,
  }
})
