import ts from 'typescript'

import { assertSchema } from './errors'
import { EAN13Validator, ean13 } from './extra/ean13'
import { URLValidator, url } from './extra/url'
import { UUIDValidator, uuid } from './extra/uuid'
import { getValidator } from './utilities'
import { AnyValidator, any } from './validators/any'
import { AnyArrayValidator, ArrayValidator, array } from './validators/array'
import { AnyBigIntValidator, BigIntValidator, bigint } from './validators/bigint'
import { BooleanValidator, boolean } from './validators/boolean'
import { ConstantValidator } from './validators/constant'
import { DateValidator, date } from './validators/date'
import { NeverValidator, never } from './validators/never'
import { AnyNumberValidator, NumberValidator, number } from './validators/number'
import { AnyObjectValidator, ObjectValidator, object } from './validators/object'
import { OptionalValidator } from './validators/optional'
import { AnyStringValidator, StringValidator, string } from './validators/string'
import { TupleValidator } from './validators/tuple'
import { AllOfValidator, OneOfValidator } from './validators/union'

import type { TypeNode } from 'typescript'
import type { Validation, Validator } from './types'

/* Our "main" validators */
const coreValidators = new Set<Validator>([
  any, array, bigint, boolean, date, ean13,
  never, number, object, string, url, uuid,
])

/* ========================================================================== *
 * QUICK SIMPLE DEEP-EQUALITY                                                 *
 * ========================================================================== */

/** Check that two of our generated types are equal */
function typeEqual(a: TypeNode, b: TypeNode): boolean {
  function eq(a: any, b: any): boolean {
    if ((typeof a === 'object' && a != null) &&
        (typeof b === 'object' && b != null) ) {
      for (const key in a) {
        if (! eq(a[key], b[key])) return false
      }
      for (const key in b) {
        /* coverage ignore if */
        if (! eq(a[key], b[key])) return false
      }
      return true
    } else {
      return a === b
    }
  }

  return eq(a, b)
}

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

/**
 * Generate typings (validated or input type) for the given `Validation`s.
 *
 * When `isInput` is `false` (the default) then the _validated_ type will be
 * generated (that is, optional fields with default values will be considered
 * as defined).
 *
 * When `isInput` is `true` then the _input_ type will be generated (that is,
 * optional fields will be considered as optional).
 */
export function generateTypes(
    validations: Record<string, Validation>,
    isInput: boolean = false,
): string {
  /* Mapping from names to validators */
  const validators = new Map<string, Validator>()
  /* Reverse mapping of first validator to their exported name */
  const references = new Map<Validator, string>()

  /* Convert all our input validations into proper validators we can examine */
  for (const [ name, validation ] of Object.entries(validations)) {
    const validator = getValidator(validation)
    validators.set(name, validator)
    if ((! references.has(validator)) && (! coreValidators.has(validator))) {
      references.set(validator, name)
    }
  }

  /* Now convert all our validators into TypeScript `TypeNode`s */
  const types = generateTypeNodes(validators, references, isInput)

  /* Then convert all our `TypeNode`s into alias declarations */
  const aliases: ts.TypeAliasDeclaration[] = []
  for (const [ name, type ] of types.entries()) {
    const alias = ts.factory.createTypeAliasDeclaration(exportModifiers, name, [], type)
    aliases.push(alias)
  }

  /* And finally print out all our type aliases */
  return ts.createPrinter().printList(
      ts.ListFormat.SourceFileStatements,
      ts.factory.createNodeArray(aliases),
      ts.createSourceFile('types.d.ts', '', ts.ScriptTarget.Latest))
}

/**
 * Generate a full declaration map for the specified validations.
 *
 * The full declaration map will include validated and input types and the
 * declaration of the validator itself. For example:
 *
 * ```ts
 * const testValidator = object({ test: optional(string, 'myValue' ) })
 * generateDeclarations({ testValidator })
 * ```
 *
 * Will result in the following declaration to be emitted:
 *
 * ```ts
 * export type Test: { test: string }
 * export type TestInput: { test?: string }
 * export const testValidator: Validator<Test, TestInput>
 * ```
 */
export function generateDeclarations(validations: Record<string, Validation>): string {
  /* Array of names: the exported constant, the input type, and the validated output type */
  const names: { name: string, output: string, input: string }[] = []
  /* Map of all validators for validated output type generation, and name references */
  const outputValidators = new Map<string, Validator>()
  const outputReferences = new Map<Validator, string>()
  /* Map of all validators for input type generation, and name references */
  const inputValidators = new Map<string, Validator>()
  const inputReferences = new Map<Validator, string>()

  /* Go through _all_ validations one by one and prepare names and validators */
  for (const [ name, validation ] of Object.entries(validations)) {
    /* Prep the name prefix for input and output types */
    const prefix = /validator$/i.test(name) ? name.slice(0, -9) :
                   /validation$/i.test(name) ? name.slice(0, -10) :
                   name
    /* Output and input name */
    const output = `${prefix.slice(0, 1).toUpperCase()}${prefix.slice(1)}`
    const input = `${prefix.slice(0, 1).toUpperCase()}${prefix.slice(1)}Input`
    /* Validator from validation */
    const validator = getValidator(validation)

    /* Remember names and validators */
    names.push({ name, output, input })
    outputValidators.set(output, validator)
    inputValidators.set(input, validator)
    if (! outputReferences.has(validator)) outputReferences.set(validator, output)
    if (! inputReferences.has(validator)) inputReferences.set(validator, input)
  }

  /* Generate all output and input types */
  const outputTypes = generateTypeNodes(outputValidators, outputReferences, false)
  const inputTypes = generateTypeNodes(inputValidators, inputReferences, true)

  /* Array of all statements of the DTS, starting with a comment */
  const statements: ts.Statement[] = []

  /* Go through each validation, exporting types and variable declarations */
  for (const { name, input, output } of names) {
    /* Get output and input types, asserting their existance */
    const outputType = outputTypes.get(output)
    const inputType = inputTypes.get(input)
    const validation = validations[name]
    const validator = outputValidators.get(output)
    assertSchema(!! outputType, `No output type "${output}" generated for validation "${name}"`)
    assertSchema(!! inputType, `No input type "${input}" generated for validation "${name}"`)
    assertSchema(!! validator, `No validator for "${name}"`)

    /* Check if input and output types are equal */
    const sameType = typeEqual(inputType, outputType)

    /* The input can be a simple *reference* to the output type, if those are equal */
    const inputAlias = sameType ? ts.factory.createTypeReferenceNode(output) : inputType

    /* Type alias declarations for output and input types:
     * > export type MyType = ....
     * > export type MyTypeInput = ... _or_ MyType
     */
    const outputDeclaration = ts.factory.createTypeAliasDeclaration(exportModifiers, output, [], outputType)
    const inputDeclaration = ts.factory.createTypeAliasDeclaration(exportModifiers, input, [], inputAlias)

    /* Variable declaration type */
    const variableDeclarationType = generateVariableDeclarationType(validation, validator, outputReferences)

    /* Variable statement: export const myTypeValidator = ... */
    const variableDeclaration =
      ts.factory.createVariableStatement(
          exportModifiers, // "export"
          ts.factory.createVariableDeclarationList([
            ts.factory.createVariableDeclaration(
                name, // ..................................... "myTypeValidator"
                undefined, // no exclamation token
                variableDeclarationType,
            ),
          ], ts.NodeFlags.Const), // ......................... "const"
      )

    /* Comments for the generated nodes */
    ts.addSyntheticLeadingComment(
        outputDeclaration,
        ts.SyntaxKind.MultiLineCommentTrivia,
        ` ${`----- ${name} `.padEnd(74, '-')} `,
        true, // newline
    )

    ts.addSyntheticLeadingComment(
        outputDeclaration,
        ts.SyntaxKind.MultiLineCommentTrivia,
        `* Validated type for {@link ${name}} `,
        true, // newline
    )

    ts.addSyntheticLeadingComment(
        inputDeclaration,
        ts.SyntaxKind.MultiLineCommentTrivia,
        `* Input type for {@link ${name}} `,
        true, // newline
    )

    ts.addSyntheticLeadingComment(
        variableDeclaration,
        ts.SyntaxKind.MultiLineCommentTrivia,
        `* The \`${name}\` validator `,
        true, // newline
    )

    /* Push our statements */
    statements.push(
        outputDeclaration,
        inputDeclaration,
        variableDeclaration,
    )
  }

  /* Pretty print our DTS */
  return ts.createPrinter().printList(
      ts.ListFormat.SourceFileStatements,
      ts.factory.createNodeArray(statements),
      ts.createSourceFile('types.d.ts', '', ts.ScriptTarget.Latest))
}

/* ========================================================================== *
 * VALIDATOR CONSTANT DECLARATIONS                                            *
 * ========================================================================== */

/** Check if the specified Validation (or function) is a Validator */
function isValidator(validation: Validation | Function): validation is Validator {
  assertSchema(validation !== undefined, 'Found "undefined" validation in tree')

  /* Accept only non-null objects or functions */
  if (validation === null) return false
  if ((typeof validation !== 'function') && (typeof validation !== 'object')) {
    return false
  }

  /* Arrays (tuples) are never a validator */
  if (Array.isArray(validation)) return false

  /* We must have a "validate" function which is NOT a validator itself: this
   * is an edge case when a schema is defined as { validate: string } */
  if (('validate' in validation) && (typeof validation.validate === 'function')) {
    return ! isValidator(validation.validate)
  } else {
    return false
  }
}

/** Generate an inline type import from "justus" */
function generateJustusTypeImport(
    typeName: string,
    typeArguments: ts.TypeNode[] = [],
): ts.TypeNode {
  return ts.factory.createImportTypeNode( // .................... "import"
      ts.factory.createLiteralTypeNode(
          ts.factory.createStringLiteral('justus'), // .......... "justus"
      ),
      undefined, // import assertions
      ts.factory.createIdentifier(typeName), // ................. "JustusType"
      typeArguments) // ......................................... "<Arg, ...>"
}

/** Generate the _type_ for a variable declaration associated with a validator */
function generateVariableDeclarationType(
    validation: Validation,
    validator: Validator,
    references: Map<Validator, string>,
): ts.TypeNode {
  /* Validation can be one of the following:
   * - validator
   * - constant (null, number, string, boolean, ...)
   * - schema (any other object that is _not_ an array)
   * - tuple (an array)
   */

  /* This will take care of validators: import("justus").Validator<MyType> */
  if (isValidator(validation)) {
    const validatedType = generateTypeNode(validator, references, false)
    return generateJustusTypeImport('Validator', [ validatedType ])
  }

  /* This will take care of constants */
  if (validator instanceof ConstantValidator) {
    return generateTypeNode(validator, references, false)
  }

  /* This will take care of schemas */
  if (validator instanceof ObjectValidator) {
    const properties: ts.PropertySignature[] = []

    for (const [ key, valueValidator ] of validator.validators.entries()) {
      const value = validator.schema[key]
      const type = generateVariableDeclarationType(value, valueValidator, references)

      properties.push(ts.factory.createPropertySignature(
          readonlyModifiers,
          key,
          undefined, // no question mark
          type))
    }

    if (validator.additionalProperties) {
      const additional = validator.additionalProperties
      const type = generateVariableDeclarationType(additional, additional, references)

      properties.push(ts.factory.createPropertySignature(
          readonlyModifiers,
          ts.factory.createComputedPropertyName(
              ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier('Symbol'),
                  'justusAdditionalValidator')),
          undefined, // no question mark
          type))
    }

    return ts.factory.createTypeLiteralNode(properties)
  }

  /* Still to do: tuples */
  assertSchema(false, `Unable to generate variable declaration for ${validator.constructor.name}`)
}

/* ========================================================================== *
 * TYPE GENERATORS                                                            *
 * ========================================================================== */

/** Generate all TypeScript `TypeNode` following the validators specified. */
function generateTypeNodes(
    validators: ReadonlyMap<string, Validator>,
    references: ReadonlyMap<Validator, string>,
    isInput: boolean,
): Map<string, ts.TypeNode> {
  /* Our types map, */
  const types = new Map<string, ts.TypeNode>()

  /* Walk through our validators map, and produce all `TypeNode`s */
  for (const [ name, validator ] of validators.entries()) {
    /* Here we _clone_ our references map, and remove the validator being
     * exported, if it has the same name. This will make sure that we don't
     * have any loops in our types or things like `type Foo = Foo`. */
    const referenceable = new Map(references)
    if (referenceable.get(validator) === name) referenceable.delete(validator)

    types.set(name, generateTypeNode(validator, referenceable, isInput))
  }

  /* Return our new map */
  return types
}

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

  // If the validator is not optional (or has no default value and we're
  // generating an _input_ type), then we return the type straight
  if (!(validator.optional || (isInput && (validator.defaultValue !== undefined)))) {
    return type
  }

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
const bigintType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword)
const booleanType = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
const dateType = ts.factory.createTypeReferenceNode('Date')
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
// "export" modifier for declarations
const exportModifiers = [ ts.factory.createModifier(ts.SyntaxKind.ExportKeyword) ]
// "readonly" modifier for declarations
const readonlyModifiers = [ ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword ) ]

/* ========================================================================== */

// Simple generator returning nodes

registerTypeGenerator(AnyValidator, () => anyType)
registerTypeGenerator(AnyArrayValidator, () => anyArrayType)
registerTypeGenerator(AnyBigIntValidator, () => bigintType)
registerTypeGenerator(AnyNumberValidator, () => numberType)
registerTypeGenerator(AnyObjectValidator, () => recordType)
registerTypeGenerator(AnyStringValidator, () => stringType)
registerTypeGenerator(NeverValidator, () => neverType)

/* ========================================================================== */

// Complex generator functions...

registerTypeGenerator(ArrayValidator, (validator, references, isInput) => {
  const itemType = generateTypeNode(validator.items, references, isInput)
  return ts.factory.createArrayTypeNode(itemType)
})

registerTypeGenerator(BigIntValidator, (validator: BigIntValidator, _references, isInput) => {
  if (isInput) {
    const types: ts.TypeNode[] = [ bigintType ]
    if (validator.fromNumber) types.push(numberType)
    if (validator.fromString) types.push(stringType)
    return types.length === 1 ? types[0] : ts.factory.createUnionTypeNode(types)
  }

  if (! validator.brand) return bigintType

  const signature = ts.factory.createPropertySignature(undefined, `__brand_${validator.brand}`, undefined, neverType)
  const literal = ts.factory.createTypeLiteralNode([ signature ])
  return ts.factory.createIntersectionTypeNode([ bigintType, literal ])
})

registerTypeGenerator(BooleanValidator, (validator, _references, isInput) => {
  return (isInput && validator.fromString) ?
      ts.factory.createUnionTypeNode([
        booleanType,
        ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('true')),
        ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('false')),
      ]) :
      booleanType
})

registerTypeGenerator(ConstantValidator, (validator) => {
  const literal =
    typeof validator.constant === 'number' ? ts.factory.createNumericLiteral(validator.constant) :
    typeof validator.constant === 'string' ? ts.factory.createStringLiteral(validator.constant) :
    typeof validator.constant === 'bigint' ? ts.factory.createBigIntLiteral(`${validator.constant}n`) :
    validator.constant === false ? ts.factory.createFalse() :
    validator.constant === true ? ts.factory.createTrue() :
    validator.constant === null ? ts.factory.createNull() :
    undefined

  assertSchema(!! literal, `Invalid constant "${validator.constant}"`)
  return ts.factory.createLiteralTypeNode(literal)
})

registerTypeGenerator(DateValidator, (validator: DateValidator, _references, isInput) => {
  return isInput ?
             validator.format === 'iso' ? stringType :
             validator.format === 'timestamp' ? numberType :
             ts.factory.createUnionTypeNode([ dateType, numberType, stringType ]) :
         dateType
})

registerTypeGenerator(NumberValidator, (validator: NumberValidator, _references, isInput) => {
  if (isInput) {
    return validator.fromString ?
      ts.factory.createUnionTypeNode([ numberType, stringType ]) :
      numberType
  }

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

registerTypeGenerator(StringValidator, (validator: StringValidator, _references, isInput) => {
  if ((! validator.brand) || (isInput)) return stringType

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

    // the optional keyword (question mark) is added when either the validator
    // is optional or, when in input mode, there is no default value
    const optional = (isInput && valueValidator.defaultValue !== undefined) ||
                     valueValidator.optional

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

    if (properties.length === 0) return extra

    const type = ts.factory.createTypeLiteralNode(properties)
    return ts.factory.createIntersectionTypeNode([ type, extra ])
  } else {
    return ts.factory.createTypeLiteralNode(properties)
  }
})

/* ===== EXTRA TYPES ======================================================== */

registerTypeGenerator(EAN13Validator, (_validator, _references, isInput) => {
  if (isInput) return ts.factory.createUnionTypeNode([ numberType, stringType ])

  const signature = ts.factory.createPropertySignature(undefined, '__ean_13', undefined, neverType)
  const literal = ts.factory.createTypeLiteralNode([ signature ])
  return ts.factory.createIntersectionTypeNode([ stringType, literal ])
})

registerTypeGenerator(UUIDValidator, (_validator, _references, isInput) => {
  if (isInput) return stringType

  const signature = ts.factory.createPropertySignature(undefined, '__uuid', undefined, neverType)
  const literal = ts.factory.createTypeLiteralNode([ signature ])
  return ts.factory.createIntersectionTypeNode([ stringType, literal ])
})

registerTypeGenerator(URLValidator, (_validator, _references, isInput) => {
  const urlType = ts.factory.createTypeReferenceNode('URL')
  if (isInput) {
    return ts.factory.createUnionTypeNode([ urlType, stringType ])
  } else {
    return urlType
  }
})
