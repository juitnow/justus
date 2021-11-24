/* ========================================================================== *
 * SYMBOLS IDENTIFYING SPECIAL FUNCTIONALITIES                                *
 * ========================================================================== */

/** A symbol indicating the `Validator` for a `Tuple`'s rest parameter. */
export const restValidator = Symbol.for('justus.restValidator')

/** A symbol indicating the `Validator` for a `Schema`. */
export const schemaValidator = Symbol.for('justus.schemaValidator')

/** A symbol indicating the `Validator` for a `Modifier`. */
export const modifierValidator = Symbol.for('justus.modifierValidator')

/** A symbol indicating that a `Schema` can have additional properties. */
export const additionalProperties = Symbol.for('justus.additionalProperties')


/* ========================================================================== *
 * BASIC VALIDATION TYPES                                                     *
 * ========================================================================== */

/**
 * Options to be using while validating.
 *
 * @public
 */
export interface ValidationOptions {
  /** Strip additional, undeclared properties from objects */
  readonly stripAdditionalProperties: boolean,
  /** Ignore and strip forbidden (`never`) properties from objects */
  readonly stripForbiddenProperties: boolean,
}

/**
 * A `Validator` is an object capable of validating a given _value_ and
 * (possibly) converting it the required type `T`.
 *
 * @public
 */
export abstract class Validator<T = any> implements Iterable<TupleRestParameter<T>> {
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
 *
 * @public
 */
export type Validation =
  (() => Validator) | Validator | // Validator instances or their creators
  Tuple | Schema | // Tuples or schemas (arrays, objects)
  null | boolean | number | string // Primitives, mapped as constants

/**
 * Infer the type returned by a `Validation` when validating.
 *
 * @public
 */
export type InferValidation<V> =
  // Let `InferValidationType<T>` be liberal in the type it accepts and check
  // here whether it extends `Validation`
  V extends Validation ?

    // `Validation` can be a function returning a `Validator`, here we need to
    // extract the return value of its _zero-arguments_ overload
    V extends {
      (...args: infer A0): Validator<infer R0>;
      (...args: infer A1): Validator<infer R1>;
      (...args: infer A2): Validator<infer R2>;
      (...args: infer A3): Validator<infer R3>;
      (...args: infer A4): Validator<infer R4>;
      (...args: infer A5): Validator<infer R5>;
      (...args: infer A6): Validator<infer R6>;
      (...args: infer A7): Validator<infer R7>;
      (...args: infer A8): Validator<infer R8>;
      (...args: infer A9): Validator<infer R9>;
    } ?
      A0 extends [] ? R0 :
      A1 extends [] ? R1 :
      A2 extends [] ? R2 :
      A3 extends [] ? R3 :
      A4 extends [] ? R4 :
      A5 extends [] ? R5 :
      A6 extends [] ? R6 :
      A7 extends [] ? R7 :
      A8 extends [] ? R8 :
      A9 extends [] ? R9 :
      never :

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
type InferValidationOrTupleRest<T> =
  T extends TupleRestParameter<infer X> ? X :
  T extends Validation ? InferValidation<T> :
  never

/* -------------------------------------------------------------------------- */

/**
 * A `Tuple` is defined to be an array of `Validation` or `TupleRest`
 *
 * @public
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
 *
 * @public
 */
export type TupleRestParameter<T = any> = {
  [restValidator] : Validator<T>
}

/**
 * Infer the type returned by a `TupleValidator` when validating an array.
 *
 * @public
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

export interface Schema {
  [ key: string ] : Validation | Modifier | Never
  [ additionalProperties ]?: Validator
  [ schemaValidator ]?: Validator
}

export interface AdditionalProperties<V extends Validator> {
  [ additionalProperties ]: V
}

/* -------------------------------------------------------------------------- */

export interface Modifier<V extends Validator = Validator> {
  [ modifierValidator ]: V
  readonly?: true,
  optional?: true,
}

export interface ReadonlyModifier<V extends Validator = Validator> extends Modifier<V> {
  readonly: true,
}

export interface OptionalModifier<V extends Validator = Validator> extends Modifier<V> {
  optional: true,
}

export interface CombinedModifier<V extends Validator = Validator>
  extends ReadonlyModifier<V>, OptionalModifier<V>, Modifier<V> {
  readonly: true,
  optional: true,
}

/* -------------------------------------------------------------------------- */

export interface Never {
  never: true
}

/* ========================================================================== *
 * INFER OBJECT TYPE FROM SCHEMA                                              *
 * ========================================================================== */

/** Infer the type validated by a `Schema` */
export type InferSchema<S extends Schema> =
  InferReadonlyModifiers<S> &
  InferOptionalModifiers<S> &
  InferCombinedModifiers<S> &
  (
    S extends AdditionalProperties<never> ?
      InferValidators<S> :
    S extends AdditionalProperties<Validator<infer V>> ?
      Record<string, V> &
      InferRemovedProperties<S> &
      InferValidators<S> :
    InferValidators<S>
  )

/* -------------------------------------------------------------------------- */

/** Infer the type of keys associated with `Validator`s */
type InferValidators<S extends Schema> = {
  [ key in keyof S as
      key extends string ?
        S[key] extends Validation ? key :
        never :
      never
  ] :
    S[key] extends Validation ? InferValidation<S[key]> :
    never
}

/* -------------------------------------------------------------------------- */

type InferReadonlyModifiers<S extends Schema> = {
  readonly [ key in keyof S as
    key extends string ?
      S[key] extends OptionalModifier<Validator> ? never :
      S[key] extends ReadonlyModifier<Validator> ? key :
      never :
    never
  ] :
    S[key] extends ReadonlyModifier<infer V> ? InferValidation<V> : never
}

type InferOptionalModifiers<S extends Schema> = {
  [ key in keyof S as
    key extends string ?
      S[key] extends ReadonlyModifier<Validator> ? never :
      S[key] extends OptionalModifier<Validator> ? key :
      never :
    never
  ] ? :
    S[key] extends OptionalModifier<infer V> ? InferValidation<V> : never
}

type InferCombinedModifiers<S extends Schema> = {
  readonly [ key in keyof S as
    key extends string ?
      S[key] extends CombinedModifier ? key :
      never :
    never
  ] ? :
    S[key] extends CombinedModifier<infer V> ? InferValidation<V> : never
}

/* -------------------------------------------------------------------------- */

type InferRemovedProperties<S extends Schema> =
  { [ key in keyof S as
      key extends string ?
        S[key] extends Never ? key :
        never :
      never
    ] : never
  }
