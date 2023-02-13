/* ========================================================================== *
 * SYMBOLS IDENTIFYING SPECIAL FUNCTIONALITIES                                *
 * ========================================================================== */

/** A symbol indicating that an instance is (in fact) a `Validator`. */
export const isValidator = Symbol.for('justus.isValidator')

/** A symbol indicating the `Validator` for a `Tuple`'s rest parameter. */
export const restValidator = Symbol.for('justus.restValidator')

/** A symbol indicating the `Validator` for a `Schema`. */
export const schemaValidator = Symbol.for('justus.schemaValidator')

/** A symbol indicating the `Validator` for a `Schema`'s additional properties. */
export const additionalValidator = Symbol.for('justus.additionalValidator')

/** A symbol indicating that a `Schema` property is _forbidden_. */
export const never = Symbol.for('justus.never')

/* ========================================================================== *
 * BASIC VALIDATION TYPES                                                     *
 * ========================================================================== */

/**
 * Options to be using while validating.
 */
export interface ValidationOptions {
  /** Strip additional, undeclared properties from objects */
  readonly stripAdditionalProperties: boolean,
  /** Strip `null`s from an object when associated with an optional key */
  readonly stripOptionalNulls: boolean,
  /** Ignore and strip forbidden (`never`) properties from objects */
  readonly stripForbiddenProperties: boolean,
}

/**
 * A `Validator` is an object capable of validating a given _value_ and
 * (possibly) converting it the required type `T`.
 */
export interface Validator<T = any> extends Iterable<TupleRestParameter<T>> {
  [isValidator]: true

  readonly?: boolean
  optional?: boolean

  /** Validate a _value_ and optionally convert it to the required `Type` */
  validate(value: unknown, options: ValidationOptions): T

  /** Allow any `Validator` to be used as a rest parameter in `Tuple`s */
  [Symbol.iterator](): Generator<TupleRestParameter<T>>;
}

/**
 * Create a validator "factory", that is a function that when invoked will
 * create a new `Validator` according to the parameters specified. This function
 * will also implement the `Validator` interface itself, using the `Validator`
 * supplied as the first parameter.
 */
export function makeValidatorFactory<
  V extends Validator,
  F extends (...args: any[]) => Validator,
>(validator: V, factory: F): F & V {
  return Object.assign(factory, {
    readonly: validator.readonly,
    optional: validator.optional,
    validate: validator.validate.bind(validator),
    [Symbol.iterator]: validator[Symbol.iterator].bind(validator),
    [isValidator]: true,
  }) as F & V
}

/**
 * A `Validator` is an object capable of validating a given _value_ and
 * (possibly) converting it the required type `T`.
 */
export abstract class AbstractValidator<T = any> implements Iterable<TupleRestParameter<T>> {
  [isValidator]: true = true

  readonly?: boolean = undefined
  optional?: boolean = undefined

  /** Validate a _value_ and optionally convert it to the required `Type` */
  abstract validate(value: unknown, options: ValidationOptions): T

  /** Allow any `Validator` to be used as a rest parameter in `Tuple`s */
  * [Symbol.iterator](): Generator<TupleRestParameter<T>> {
    yield { [restValidator]: this }
  }
}

/**
 * The `Validation` type indicates all potential types which could be used
 * as _sources_ for validation.
 *
 * Those are:
 *
 * * A `Validator` instance or a _zero-arguments_ function returning one
 * * A `Tuple` or a `Schema`, validated as arrays or object
 * * Either `null`, a `boolean`, a `number` or a `string` for constants
 */
export type Validation =
  Validator | // Validator instances
  Tuple | Schema | // Tuples or schemas (arrays, objects)
  null | boolean | number | string // Primitives, mapped as constants

/**
 * Infer the type returned by a `Validation` when validating.
 */
export type InferValidation<V> =
  // Let `InferValidationType<T>` be liberal in the type it accepts and check
  // here whether it extends `Validation`
  V extends Validation ?
    // Validators return their validation type
    V extends Validator<infer T> ? T :

    // Tuples and schemas are inferred using their own types
    V extends Tuple ? InferTuple<V> :
    V extends Schema ? InferSchema<V> :

    // Primitives are returned as constants
    V extends boolean ? V :
    V extends number ? V :
    V extends string ? V :
    V extends null ? V :
    never :
  never


/* ========================================================================== *
 * TUPLES                                                                     *
 * ========================================================================== */

/** Infer the type validated by a `Validation` or `TupleRestParameter` */
export type InferValidationOrTupleRest<T> =
  T extends TupleRestParameter<infer X> ? X :
  T extends Validation ? InferValidation<T> :
  never

/* -------------------------------------------------------------------------- */

/**
 * A `Tuple` is defined to be an array of `Validation` or `TupleRest`
 */
export type Tuple = readonly (Validation | TupleRestParameter)[]

/**
 * The `TupleRestParameter` defines a tuple member that can occur several
 * times while validating an array.
 *
 * Every `Validator` is an `Iterable` of `TupleRestParameters` so that it can
 * be used in tuples. For example, to indicate a tuple composed by a number,
 * followed by zero or more non-empty strings we can write:
 *
 * ```
 * const nonEmptyString = string({ minLength: 1 })
 * const myTuple = tuple([ number, ...nonEmptyString ])
 * ```
 */
export type TupleRestParameter<T = any> = {
  [restValidator] : Validator<T>
}

/**
 * Infer the type returned by a `TupleValidator` when validating an array.
 */
export type InferTuple<T> =
  T extends Tuple ?
    T extends readonly [] ? [] :
    T extends readonly [ Validation, ...any[] ] ?
      T extends readonly [ infer V, ...infer Rest ] ?
        [ InferValidation<V>, ...InferTuple<Rest> ] :
      never :
    T extends readonly [ ...any[], Validation ] ?
      T extends readonly [ ...infer Rest, infer V ] ?
        [ ...InferTuple<Rest>, InferValidation<V> ] :
      never :
    T extends readonly (infer V)[] ?
      [ ...InferValidationOrTupleRest<V>[] ] :
    never :
  never


/* ========================================================================== *
 * OBJECT SCHEMAS                                                             *
 * ========================================================================== */

/**
 * The `Schema` interface defines what properties are defined for objects and
 * how they should be validated.
 */
export interface Schema {
  [ key: string ] : Validation | typeof never
  [ additionalValidator ]?: Validator | false
}

/**
 * An interface defining whether a `Schema` should include additional
 * properties, and the `Validator` used to validate them.
 */
export interface AdditionalProperties<V extends Validator | false> {
  [ additionalValidator ]: V
}

/* ========================================================================== *
 * INFER OBJECT TYPE FROM SCHEMA                                              *
 * ========================================================================== */

/** Infer the type validated by a `Schema` */
export type InferSchema<S extends Schema> =
  S extends AdditionalProperties<Validator<infer V>> ?
    { [ key in string ] : V | undefined } & InferSchema2<S> :
    InferSchema2<S>

/** Infer the property types described by a `Schema` */
export type InferSchema2<S extends Schema> =
  { [ key in keyof S as key extends string ? key : never ]:
    InferValidation<S[key]>
  } | {
    readonly [ key in keyof S as key extends string ? key : never ]:
    S[key] extends Validator & { readonly: true } ? InferValidation<S[key]> :
    never
  }


/* ========================================================================== *
 * TYPE BRANDING                                                              *
 * ========================================================================== */

/** Utility type to infer primitive branding according to a string */
export type Branding<S extends string> = {
  [ key in keyof { __brand: never } as `__brand_${S}` ] : never
}
