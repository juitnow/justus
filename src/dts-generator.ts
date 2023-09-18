import ts from 'typescript'

import { assertSchema } from './errors'
import { URLValidator } from './extra/url'
import { getValidator } from './utilities'
import { AnyValidator } from './validators/any'
import { AnyArrayValidator, ArrayValidator } from './validators/array'
import { BooleanValidator } from './validators/boolean'
import { ConstantValidator } from './validators/constant'
import { DateValidator } from './validators/date'
import { NeverValidator } from './validators/never'
import { AnyNumberValidator, NumberValidator } from './validators/number'
import { AnyObjectValidator, ObjectValidator } from './validators/object'
import { OptionalValidator } from './validators/optional'
import { AnyStringValidator, StringValidator } from './validators/string'
import { TupleValidator } from './validators/tuple'
import { AllOfValidator, OneOfValidator } from './validators/union'

import type { Validation, Validator } from './types'

/* ========================================================================== *
 * LOCAL TYPES                                                                *
 * ========================================================================== */

/** A function taking a `Validator` and producing its `TypeNode`. */
type TypeGenerator<V extends Validator = Validator> = (
  validator: V,
  references: ReadonlyMap<Validator, string>,
  isInput: boolean,
) => ts.TypeNode

/** The generic constructor of a `Validator` instance. */
type ValidatorConstructor<V extends Validator = Validator> = { // <T = any> = {
  new (...args: any[]): V
}

/* ========================================================================== *
 * GENERATE TYPES FOR VALIDATORS                                              *
 * ========================================================================== */

/** Registry of all `Validator` constructors and related `TypeGenerator`s. */
const generators = new Map<Function | Validator, TypeGenerator<any>>()

/** Register a `TypeGenerator` function for a `Validator`. */
export function registerTypeGenerator<V extends Validator>(
    validator: V | ValidatorConstructor<V>,
    generator: TypeGenerator<V>,
): void {
  generators.set(validator, generator)
}

/** Generate typings for the given `Validation`s. */
export function generateTypes(validations: Record<string, Validation>, isInput: boolean = false): string {
  // Create two maps (one mapping "string -> validator" and another mapping
  // "validator -> string"). The first map will serve as our "exports" map,
  // while the second will make sure that any exported validator gets referenced
  // in the generated DTS, rather than being re-generated
  const validators = new Map<string, Validator>()
  const references = new Map<Validator, string>()

  Object.entries(validations).forEach(([ name, validation ]) => {
    const validator = getValidator(validation)
    // References will be added only once, first one takes precedence!
    if (! references.has(validator)) references.set(validator, name)
    validators.set(name, validator)
  })

  // Create the array of type alias declarations to be printed and exported
  const types: ts.TypeAliasDeclaration[] = []
  for (const [ name, validator ] of validators.entries()) {
    // Clone our references map, and remove the validator being exported. This
    // will make sure that we don't have any loops in our types
    const referenceable = new Map(references)
    if (referenceable.get(validator) === name) {
      referenceable.delete(validator)
    }

    // Generate the type of the validator, with our stripped reference table
    const type = generateTypeNode(validator, referenceable, isInput)

    // Create a type alias declaration with the name of the export
    const modifiers = [ ts.factory.createModifier(ts.SyntaxKind.ExportKeyword) ]
    const decl = ts.factory.createTypeAliasDeclaration(modifiers, name, [], type)
    types.push(decl)
  }

  // Print out all our type aliases
  return ts.createPrinter().printList(
      ts.ListFormat.SourceFileStatements,
      ts.factory.createNodeArray(types),
      ts.createSourceFile('types.d.ts', '', ts.ScriptTarget.Latest))
}

/* ========================================================================== *
 * TYPE GENERATORS                                                            *
 * ========================================================================== */

/** Generate a TypeScript `TypeNode` for the given validator instance. */
function generateTypeNode(
    validator: Validator,
    references: ReadonlyMap<Validator, string>,
    isInput: boolean,
): ts.TypeNode {
  const reference = references.get(validator)
  if (reference) return ts.factory.createTypeReferenceNode(reference)

  const generator = generators.get(validator) || generators.get(validator.constructor)
  assertSchema(!! generator, `Type generator for "${validator.constructor.name}" not found`)
  const type = generator(validator, references, isInput)

  if (!(validator.optional || (isInput && (validator.defaultValue !== undefined)))) {
    return type
  }

  // If the validator is not optional, then we return the type straight
  // if (! validator.optional) return type

  // If the type would result in "never | undefined" simply return "undefined"
  if (type === neverType) return undefinedType

  // If the type is already a union type, we simply add our "undefined"
  if (ts.isUnionTypeNode(type)) {
    return ts.factory.createUnionTypeNode([ ...type.types, undefinedType ])
  }

  // Create a new type "type | undefined"
  return ts.factory.createUnionTypeNode([ type, undefinedType ])
}

/* ========================================================================== */

// Simple nodes

const anyType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
const anyArrayType = ts.factory.createArrayTypeNode(anyType)
const booleanType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
const numberType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
const neverType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
const stringType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
const undefinedType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword)
const recordType = ts.factory.createMappedTypeNode(
    undefined, // readonly
    ts.factory.createTypeParameterDeclaration([], 'key', stringType),
    undefined, // name type
    undefined, // question token
    anyType, // type of the mapped key
    undefined) // members

// "Optional" modifier (the "?" token )
const optionalKeyword = ts.factory.createToken(ts.SyntaxKind.QuestionToken)

/* ========================================================================== */

// Simple generator returning nodes

registerTypeGenerator(AnyValidator, () => anyType)
registerTypeGenerator(AnyArrayValidator, () => anyArrayType)
registerTypeGenerator(AnyNumberValidator, () => numberType)
registerTypeGenerator(AnyObjectValidator, () => recordType)
registerTypeGenerator(AnyStringValidator, () => stringType)
registerTypeGenerator(BooleanValidator, () => booleanType)
registerTypeGenerator(NeverValidator, () => neverType)
registerTypeGenerator(DateValidator, () => ts.factory.createTypeReferenceNode('Date'))
registerTypeGenerator(URLValidator, () => ts.factory.createTypeReferenceNode('URL'))

/* ========================================================================== */

// Complex generator functions...

registerTypeGenerator(ArrayValidator, (validator, references, isInput) => {
  const itemType = generateTypeNode(validator.items, references, isInput)
  return ts.factory.createArrayTypeNode(itemType)
})

registerTypeGenerator(ConstantValidator, (validator) => {
  const literal =
    typeof validator.constant === 'number' ? ts.factory.createNumericLiteral(validator.constant) :
    typeof validator.constant === 'string' ? ts.factory.createStringLiteral(validator.constant) :
    validator.constant === false ? ts.factory.createFalse() :
    validator.constant === true ? ts.factory.createTrue() :
    validator.constant === null ? ts.factory.createNull() :
    undefined

  assertSchema(!! literal, `Invalid constant "${validator.constant}"`)
  return ts.factory.createLiteralTypeNode(literal)
})

registerTypeGenerator(NumberValidator, (validator: NumberValidator) => {
  if (! validator.brand) return numberType

  const signature = ts.factory.createPropertySignature(undefined, `__brand_${validator.brand}`, undefined, neverType)
  const literal = ts.factory.createTypeLiteralNode([ signature ])
  return ts.factory.createIntersectionTypeNode([ numberType, literal ])
})

registerTypeGenerator(OptionalValidator, (validator: OptionalValidator, references, isInput: boolean) => {
  // return the wrappeed type. The '... | undefined' part of the optional will
  // be added in 'generateTypeNode' above, as _any_ validator can be optional
  return generateTypeNode(validator.validator, references, isInput)
})

registerTypeGenerator(StringValidator, (validator: StringValidator) => {
  if (! validator.brand) return stringType

  const signature = ts.factory.createPropertySignature(undefined, `__brand_${validator.brand}`, undefined, neverType)
  const literal = ts.factory.createTypeLiteralNode([ signature ])
  return ts.factory.createIntersectionTypeNode([ stringType, literal ])
})

registerTypeGenerator(TupleValidator, (validator: TupleValidator<any>, references, isInput) => {
  const members = validator.members

  // count how many rest parameters do we have..
  const { count, first, next } =
      members.reduce(({ count, first, next }, { single }, i) => {
        if (! single) {
          if (i < first) first = i
          next = i + 1
          count += 1
        }
        return { count, first, next }
      }, { count: 0, first: members.length, next: -1 })

  // if we have zero or one rest parameter, things are easy...
  if (count < 2) {
    const types = members.map(({ single, validator }) => {
      const memberType = generateTypeNode(validator, references, isInput)

      if (single) return generateTypeNode(validator, references, isInput)

      const arrayType = ts.factory.createArrayTypeNode(memberType)
      return ts.factory.createRestTypeNode(arrayType)
    })

    return ts.factory.createTupleTypeNode(types)
  }

  // We have two or more rest parameters... we need combine everything between
  // the first and the last one in a giant union!
  const before = members.slice(0, first)
      .map(({ validator }) => generateTypeNode(validator, references, isInput))
  const types = members.slice(first, next)
      .map(({ validator }) => generateTypeNode(validator, references, isInput))
  const after = members.slice(next)
      .map(({ validator }) => generateTypeNode(validator, references, isInput))

  const union = ts.factory.createUnionTypeNode(types)
  const array = ts.factory.createArrayTypeNode(union)
  const rest = ts.factory.createRestTypeNode(array)

  return ts.factory.createTupleTypeNode([ ...before, rest, ...after ])
})

registerTypeGenerator(AllOfValidator, (validator, references, isInput) => {
  const members = validator.validators.map((validator) => generateTypeNode(validator, references, isInput))
  return ts.factory.createIntersectionTypeNode(members)
})

registerTypeGenerator(OneOfValidator, (validator, references, isInput) => {
  const members = validator.validators.map((validator) => generateTypeNode(validator, references, isInput))
  return ts.factory.createUnionTypeNode(members)
})

registerTypeGenerator(ObjectValidator, (validator, references, isInput) => {
  const properties: ts.PropertySignature[] = []

  for (const [ key, valueValidator ] of validator.validators.entries()) {
    const type = generateTypeNode(valueValidator, references, isInput)
    const optional = valueValidator.optional || (isInput && valueValidator.defaultValue !== undefined)

    const signature = ts.factory.createPropertySignature(
        undefined,
        key,
        optional ? optionalKeyword : undefined,
        type)

    properties.push(signature)
  }

  if (validator.additionalProperties) {
    const propertyType = generateTypeNode(validator.additionalProperties, references, isInput)

    const extra = ts.factory.createMappedTypeNode(
        undefined, // readonly
        ts.factory.createTypeParameterDeclaration([], 'key', stringType),
        undefined, // name type
        undefined, // question token
        propertyType, // type
        undefined) // members

    if (properties.length == 0) return extra

    const type = ts.factory.createTypeLiteralNode(properties)
    return ts.factory.createIntersectionTypeNode([ type, extra ])
  } else {
    return ts.factory.createTypeLiteralNode(properties)
  }
})
