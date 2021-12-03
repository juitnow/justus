import * as ts from 'typescript'
import {
  AllOfValidator,
  AnyArrayValidator,
  AnyNumberValidator,
  AnyObjectValidator,
  AnyStringValidator,
  AnyValidator,
  ArrayValidator,
  assertSchema,
  BooleanValidator,
  ConstantValidator,
  DateValidator,
  getValidator,
  NumberValidator,
  ObjectValidator,
  OneOfValidator,
  StringValidator,
  TupleValidator,
  Validation,
  Validator,
} from './index'

/* ========================================================================== *
 * LOCAL TYPES                                                                *
 * ========================================================================== */

/** A function taking a `Validator` and producing its `TypeNode`. */
type TypeGenerator<V extends Validator = Validator> = (validator: V) => ts.TypeNode

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
export function generateTypes(validators: Record<string, Validation>): string {
  const types = Object.entries(validators).map(([ name, validation ]) => {
    const validator = getValidator(validation)
    const type = generateTypeNode(validator)
    return ts.factory.createTypeAliasDeclaration(undefined, undefined, name, [], type)
  })

  return ts.createPrinter().printList(
      ts.ListFormat.SourceFileStatements,
      ts.factory.createNodeArray(types),
      ts.createSourceFile('types.d.ts', '', ts.ScriptTarget.Latest))
}


/* ========================================================================== *
 * TYPE GENERATORS                                                            *
 * ========================================================================== */

/** Generate a TypeScript `TypeNode` for the given validator instance. */
function generateTypeNode(validator: Validator): ts.TypeNode {
  const generator = generators.get(validator.constructor)
  assertSchema(!! generator, `Type generator for "${validator.constructor.name}" not found`)
  return generator(validator)
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

registerTypeGenerator(ArrayValidator, (validator) => {
  const itemType = generateTypeNode(validator.items)
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

registerTypeGenerator(TupleValidator, (validator: TupleValidator<any>) => {
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
      const memberType = generateTypeNode(validator)

      if (single) return generateTypeNode(validator)

      const arrayType = ts.factory.createArrayTypeNode(memberType)
      return ts.factory.createRestTypeNode(arrayType)
    })

    return ts.factory.createTupleTypeNode(types)
  }

  // We have two or more rest parameters... we need combine everything between
  // the first and the last one in a giant union!
  const before = members.slice(0, first)
      .map(({ validator }) => generateTypeNode(validator))
  const types = members.slice(first, next)
      .map(({ validator }) => generateTypeNode(validator))
  const after = members.slice(next)
      .map(({ validator }) => generateTypeNode(validator))

  const union = ts.factory.createUnionTypeNode(types)
  const array = ts.factory.createArrayTypeNode(union)
  const rest = ts.factory.createRestTypeNode(array)

  return ts.factory.createTupleTypeNode([ ...before, rest, ...after ])
})

registerTypeGenerator(AllOfValidator, (validator) => {
  const members = validator.validators.map((validator) => generateTypeNode(validator))
  return ts.factory.createIntersectionTypeNode(members)
})

registerTypeGenerator(OneOfValidator, (validator) => {
  const members = validator.validators.map((validator) => generateTypeNode(validator))
  return ts.factory.createUnionTypeNode(members)
})

registerTypeGenerator(ObjectValidator, (validator) => {
  const properties: ts.PropertySignature[] = []

  for (const [ key, property ] of validator.properties.entries()) {
    const { validator, readonly, optional } = property || { optional: true }
    const type = validator ? generateTypeNode(validator) : neverType

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
        generateTypeNode(validator.additionalProperties),
        undefined) // members

    if (properties.length == 0) return extra

    const type = ts.factory.createTypeLiteralNode(properties)
    return ts.factory.createIntersectionTypeNode([ type, extra ])
  } else {
    return ts.factory.createTypeLiteralNode(properties)
  }
})
