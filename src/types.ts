/* ========================================================================== *
 * SYMBOLS IDENTIFYING SPECIAL FUNCTIONALITIES                                *
 * ========================================================================== */

declare global {
  interface SymbolConstructor {
    /** A symbol associated with a `Validator` instance. */
    readonly justusValidator: unique symbol
    /** A symbol indicating the `Validator` for a `Tuple`'s rest parameter. */
    readonly justusRestValidator: unique symbol
    /** A symbol indicating the `Validator` for a `Schema`'s additional properties. */
    readonly justusAdditionalValidator: unique symbol
  }
}

/* Inject our symbols as globals */
Object.defineProperties(Symbol, {
  justusValidator: { value: Symbol.for('justus.Validator') },
  justusRestValidator: { value: Symbol.for('justus.restValidator') },
  justusAdditionalValidator: { value: Symbol.for('justus.additionalValidator') },
})

/* ========================================================================== *
 * BASIC VALIDATION TYPES                                                     *
 * ========================================================================== */

/**
 * Options to be using while validating.
 */
export interface ValidationOptions {
  /** Strip additional, undeclared properties from objects (default: `false`) */
  stripAdditionalProperties?: boolean,
  /** Strip `null`s from an object when associated with an optional key (default: `false`) */
  stripOptionalNulls?: boolean,
  /** Ignore and strip forbidden (`never`) properties from objects (default: `false`) */
  stripForbiddenProperties?: boolean,
}

/**
 * A `Validator` is an object capable of validating a given _value_ and
 * (possibly) converting it the required type `T`.
 */
export interface Validator<T = any, I = T> extends Iterable<TupleRestParameter<T, I>> {
  [Symbol.justusValidator]: this

  /**
   * A flag indicating whether the type being validated is _optional_ (the input
   * can be `undefined`) or not (default: `false`).
   */
  optional: boolean
  /**
   * The _default_ replaced by this `Validator` when the input is `undefined`.
   *
   * This is used in conjunction with the `optional` flag.
   */
  defaultValue: T | undefined

  /** Validate a _value_ and optionally convert it to the required `Type` */
  validate(value: unknown, options?: ValidationOptions | undefined): T

  /** Allow any `Validator` to be used as a rest parameter in `Tuple`s */
  [Symbol.iterator](): Generator<TupleRestParameter<T, I>>;
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
    optional: validator.optional,
    defaultValue: validator.defaultValue,
    validate: validator.validate.bind(validator),
    [Symbol.iterator]: validator[Symbol.iterator].bind(validator),
    [Symbol.justusValidator]: validator,
  }) as F & V
}

/**
 * A `Validator` is an object capable of validating a given _value_ and
 * (possibly) converting it the required type `T`.
 */
export abstract class AbstractValidator<T, I = T>
implements Validator<T, I>, Iterable<TupleRestParameter<T, I>> {
  [Symbol.justusValidator] = this

  optional: boolean = false
  defaultValue: T | undefined = undefined

  /** Validate a _value_ and optionally convert it to the required `Type` */
  abstract validate(value: unknown, options?: ValidationOptions | undefined): T

  /** Allow any `Validator` to be used as a rest parameter in `Tuple`s */
  * [Symbol.iterator](): Generator<TupleRestParameter<T, I>> {
    yield { [Symbol.justusRestValidator]: this }
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
  // Validators return their validation type
  V extends Validator<infer T, any> ? T :

  // Primitives are returned as constants
  V extends undefined ? V :
  V extends boolean ? V :
  V extends number ? V :
  V extends string ? V :
  V extends null ? V :

  // Tuples are inferred using their own types
  V extends Tuple ? InferTuple<V> :

  // Anyhing else can only be a schema
  InferSchema<V>

/**
 * Infer the type compatible with a `Validation`'s input.
 */
export type InferInput<V> =
  // Validators return their validation type
  V extends Validator<any, infer T> ? T :

  // Primitives are returned as constants
  V extends undefined ? V :
  V extends boolean ? V :
  V extends number ? V :
  V extends string ? V :
  V extends null ? V :

  // // Tuples are inferred using their own types
  V extends Tuple ? InferInputTuple<V> :

  // // Anyhing else can only be a schema
  InferInputSchema<V>

/* ========================================================================== *
 * TUPLES                                                                     *
 * ========================================================================== */

/** Infer the type validated by a `Validation` or `TupleRestParameter` */
export type InferValidationOrTupleRest<T> =
  T extends TupleRestParameter<infer X, any> ? X :
  T extends Validation ? InferValidation<T> :
  never

/** Infer the input type for a `Validation` or `TupleRestParameter` */
export type InferInputValidationOrTupleRest<T> =
  T extends TupleRestParameter<any, infer X> ? X :
  T extends Validation ? InferInput<T> :
  never

/* -------------------------------------------------------------------------- */

/**
 * A `Tuple` is defined to be an array of `Validation` or `TupleRest`
 */
export type Tuple = readonly (Validation | TupleRestParameter<any, any>)[]

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
export type TupleRestParameter<T, I> = {
  [Symbol.justusRestValidator] : Validator<T, I>
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

/**
 * Infer a time compatible with a `TupleValidator`'s input.
 */
export type InferInputTuple<T> =
  T extends Tuple ?
    T extends readonly [] ? [] :
    T extends readonly [ Validation, ...any[] ] ?
      T extends readonly [ infer V, ...infer Rest ] ?
        [ InferInput<V>, ...InferInputTuple<Rest> ] :
      never :
    T extends readonly [ ...any[], Validation ] ?
      T extends readonly [ ...infer Rest, infer V ] ?
        [ ...InferInputTuple<Rest>, InferInput<V> ] :
      never :
    T extends readonly (infer V)[] ?
      [ ...InferInputValidationOrTupleRest<V>[] ] :
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
  [ key: string ] : Validation
  [ Symbol.justusAdditionalValidator ]?: Validator | false
}

/**
 * An interface defining whether a `Schema` should include additional
 * properties, and the `Validator` used to validate them.
 */
export interface AdditionalProperties<V extends Validator | false> {
  [ Symbol.justusAdditionalValidator ]: V
}

/* ========================================================================== *
 * INFER OBJECT TYPE FROM SCHEMA                                              *
 * ========================================================================== */

/** Infer the type validated by a `Schema` */
export type InferSchema<S> =
  S extends AdditionalProperties<Validator<infer V>> ?
    { [ key in string ] : V } & InferSchema2<S> :
    InferSchema2<S>

/** Infer the property types described by a `Schema` */
export type InferSchema2<S> = {
  // this first part of the type infers all keys from the schema into their
  // type, but makes *each* key optional... we'll restrict in the next part...
  -readonly [ key in keyof S as key extends string ? key : never ] ? : InferValidation<S[key]>
} & {
  // this second part infers *only* keys that _do not_ contain a "undefined"
  // in their unions, and associates them with the inferred value, basically
  // making the key *non optional*
  -readonly [ key in keyof S as
      key extends string ?
        undefined extends InferValidation<S[key]> ?
          never :
          key :
      never ] -? :
  InferValidation<S[key]>
}

/** Infer the input type compatible with a `Schema` */
export type InferInputSchema<S> =
  S extends AdditionalProperties<Validator<any, infer X>> ?
    { [ key in string ] : X } & InferInputSchema2<S> :
    InferInputSchema2<S>

/** Infer the input type of the properties described by a `Schema` */
export type InferInputSchema2<S> = {
  // this first part of the type infers all keys from the schema into their
  // type, but makes *each* key optional... we'll restrict in the next part...
  -readonly [ key in keyof S as key extends string ? key : never ] ? : InferInput<S[key]>
} & {
  // this second part infers *only* keys that _do not_ contain a "undefined"
  // in their unions, and associates them with the inferred value, basically
  // making the key *non optional*
  -readonly [ key in keyof S as
      key extends string ?
        InferInput<S[key]> extends never ?
          never :
        undefined extends InferInput<S[key]> ?
          never :
          key :
      never ] -? :
  InferInput<S[key]>
}

/* ========================================================================== *
 * TYPE BRANDING                                                              *
 * ========================================================================== */

/** Utility type to infer primitive branding according to a string */
export type Branding<S extends string> = {
  [ brand in `__brand_${S}` ] : never
}
