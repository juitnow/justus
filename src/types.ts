import type { InferSchema, Schema } from './schemas'

/* ========================================================================== *
 * SYMBOLS IDENTIFYING SPECIAL FUNCTIONALITIES                                *
 * ========================================================================== */

/** A symbol indicating the `Validator` for a `Tuple`'s rest parameter. */
export const restValidator = Symbol.for('justus.restValidator')

/** A symbol indicating the `Validator` for a `Schema`. */
export const schemaValidator = Symbol.for('justus.schemaValidator')

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
export abstract class Validator<T = any> {
  /** Validate a _value_ and optionally convert it to the required `Type` */
  abstract validate(value: unknown, options: ValidationOptions): T

  /** Allow any `Validator` to be used as a rest parameter in `Tuple`s */
  * [Symbol.iterator](): Generator<TupleRest<T>> {
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
 */
export type InferValidationType<V> =
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

    // Tuples and schemas are inferred using their own types
    V extends Tuple ? InferTuple<V> :
    V extends Schema ? InferSchema<V> :

    // Validators return their validation type
    V extends Validator<infer T> ? T :

    V extends boolean ? V :
    V extends number ? V :
    V extends string ? V :
    V extends null ? V :
    never :

    // V // b oolean, number, string or null
  never

/* ========================================================================== *
 * TUPLES                                                                     *
 * ========================================================================== */

export type TupleRest<T = any> = {
  [restValidator] : Validator<T>
}

export type Tuple = readonly (Validation | TupleRest)[]

type InferValidationOrTupleRest<T> =
  T extends TupleRest<infer X> ? X :
  T extends Validation ? InferValidationType<T> :
  never

export type InferTuple<T> =
  T extends Tuple ?
    T extends readonly [] ? [] :
    T extends readonly [ Validation, ...any[] ] ?
      T extends readonly [ infer V, ...infer Rest ] ?
        [ InferValidationType<V>, ...InferTuple<Rest> ] :
      never :
    T extends readonly [ ...any[], Validation ] ?
      T extends readonly [ ...infer Rest, infer V ] ?
        [ ...InferTuple<Rest>, InferValidationType<V> ] :
      never :
    T extends readonly (infer V)[] ?
      [ ...InferValidationOrTupleRest<V>[] ] :
    never :
  never
