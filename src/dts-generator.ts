import ts from 'typescript'
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
type TypeGenerator<V extends Validator = Validator> = (
  validator: V,
  references: ReadonlyMap<Validator, string>
) => ts.TypeNode

/** The generic constructor of a `Validator` instance. */
type ValidatorConstructor<V extends Validator = Validator> = { // <T = any> = {
  new (...args: any[]): V
}

/* ========================================================================== *
 * GENERATE TYPES FOR VALIDATORS                                              *
 * ========================================================================== */

/** Registry of all `Validator` constructors and related `TypeGenerator`s. */
const generators = new Map<Function, TypeGenerator<any>>()

/** Register a `TypeGenerator` function for a `Validator`. */
export function registerTypeGenerator<V extends Validator>(
    validator: ValidatorConstructor<V>,
    generator: TypeGenerator<V>,
): void {
  assertSchema(validator.prototype instanceof Validator, 'Not a `Validator` class')
  generators.set(validator, generator)
}

/** Generate typings for the given `Validation`s. */
export function generateTypes(validations: Record<string, Validation>): string {
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
    const type = generateTypeNode(validator, referenceable)

    // Create a type alias declaration with the name of the export
    const modifiers = [ ts.factory.createModifier(ts.SyntaxKind.ExportKeyword) ]
    const decl = ts.factory.createTypeAliasDeclaration(undefined, modifiers, name, [], type)
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
): ts.TypeNode {
  const reference = references.get(validator)
  if (reference) return ts.factory.createTypeReferenceNode(reference)

  const generator = generators.get(validator.constructor)
  assertSchema(!! generator, `Type generator for "${validator.constructor.name}" not found`)
  return generator(validator, references)
}

/* ========================================================================== */

// Simple nodes

const anyType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
const anyArrayType = ts.factory.createArrayTypeNode(anyType)
const booleanType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
const numberType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
const neverType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
const stringType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
const recordType = ts.factory.createMappedTypeNode(
    undefined, // readonly
    ts.factory.createTypeParameterDeclaration('key', stringType),
    undefined, // name type
    undefined, // question token
    anyType, // type of the mapped key
    undefined) // members

// Modifiers and tokens

const readonlyKeyword = [ ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword) ]
const optionalKeyword = ts.factory.createToken(ts.SyntaxKind.QuestionToken)


/* ========================================================================== */

// Simple generator returning nodes

registerTypeGenerator(AnyValidator, () => anyType)
registerTypeGenerator(AnyArrayValidator, () => anyArrayType)
registerTypeGenerator(AnyNumberValidator, () => numberType)
registerTypeGenerator(AnyObjectValidator, () => recordType)
registerTypeGenerator(AnyStringValidator, () => stringType)
registerTypeGenerator(BooleanValidator, () => booleanType)
registerTypeGenerator(DateValidator, () => ts.factory.createTypeReferenceNode('Date'))

/* ========================================================================== */

// Complex generator functions...

registerTypeGenerator(ArrayValidator, (validator, references) => {
  const itemType = generateTypeNode(validator.items, references)
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

registerTypeGenerator(StringValidator, (validator: StringValidator) => {
  if (! validator.brand) return stringType

  const signature = ts.factory.createPropertySignature(undefined, `__brand_${validator.brand}`, undefined, neverType)
  const literal = ts.factory.createTypeLiteralNode([ signature ])
  return ts.factory.createIntersectionTypeNode([ stringType, literal ])
})

registerTypeGenerator(TupleValidator, (validator: TupleValidator<any>, references) => {
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
      const memberType = generateTypeNode(validator, references)

      if (single) return generateTypeNode(validator, references)

      const arrayType = ts.factory.createArrayTypeNode(memberType)
      return ts.factory.createRestTypeNode(arrayType)
    })

    return ts.factory.createTupleTypeNode(types)
  }

  // We have two or more rest parameters... we need combine everything between
  // the first and the last one in a giant union!
  const before = members.slice(0, first)
      .map(({ validator }) => generateTypeNode(validator, references))
  const types = members.slice(first, next)
      .map(({ validator }) => generateTypeNode(validator, references))
  const after = members.slice(next)
      .map(({ validator }) => generateTypeNode(validator, references))

  const union = ts.factory.createUnionTypeNode(types)
  const array = ts.factory.createArrayTypeNode(union)
  const rest = ts.factory.createRestTypeNode(array)

  return ts.factory.createTupleTypeNode([ ...before, rest, ...after ])
})

registerTypeGenerator(AllOfValidator, (validator, references) => {
  const members = validator.validators.map((validator) => generateTypeNode(validator, references))
  return ts.factory.createIntersectionTypeNode(members)
})

registerTypeGenerator(OneOfValidator, (validator, references) => {
  const members = validator.validators.map((validator) => generateTypeNode(validator, references))
  return ts.factory.createUnionTypeNode(members)
})

registerTypeGenerator(ObjectValidator, (validator, references) => {
  const properties: ts.PropertySignature[] = []

  for (const [ key, property ] of validator.properties.entries()) {
    const { validator, readonly, optional } = property || { optional: true }
    const type = validator ? generateTypeNode(validator, references) : neverType

    const signature = ts.factory.createPropertySignature(
          readonly ? readonlyKeyword : undefined,
          key,
          optional ? optionalKeyword : undefined,
          type)

    properties.push(signature)
  }

  if (validator.additionalProperties) {
    const extra = ts.factory.createMappedTypeNode(
        undefined, // readonly
        ts.factory.createTypeParameterDeclaration('key', stringType),
        undefined, // name type
        undefined, // question token
        generateTypeNode(validator.additionalProperties, references),
        undefined) // members

    if (properties.length == 0) return extra

    const type = ts.factory.createTypeLiteralNode(properties)
    return ts.factory.createIntersectionTypeNode([ type, extra ])
  } else {
    return ts.factory.createTypeLiteralNode(properties)
  }
})
