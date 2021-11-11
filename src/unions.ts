import type {
  InferValidationType,
  Validation,
  Validator,
} from './basics'

/* ========================================================================== *
 * CONSTANTS AND UNIONS VALIDATION                                            *
 * ========================================================================== */

type CompoundType = Validation | string | number

type InferCompoundValidator<T extends CompoundType> =
  T extends Validation ? Validator<InferValidationType<T>> :
  T extends string ? Validator<T> :
  T extends number ? Validator<T> :
  never

/* -------------------------------------------------------------------------- */

export function oneOf<
  A extends CompoundType,
>(a: A): InferCompoundValidator<A>

export function oneOf<
  A extends CompoundType,
  B extends CompoundType,
>(a: A, b: B): InferCompoundValidator<A | B>

export function oneOf<
  A extends CompoundType,
  B extends CompoundType,
  C extends CompoundType,
>(a: A, b: B, c: C): InferCompoundValidator<A | B | C>

export function oneOf<
  A extends CompoundType,
  B extends CompoundType,
  C extends CompoundType,
  D extends CompoundType,
>(a: A, b: B, c: C, d: D): InferCompoundValidator<A | B | C | D>

export function oneOf<
  A extends CompoundType,
  B extends CompoundType,
  C extends CompoundType,
  D extends CompoundType,
  E extends CompoundType,
>(a: A, b: B, c: C, d: D, e: E): InferCompoundValidator<A | B | C | D | E>

export function oneOf<
  A extends CompoundType,
  B extends CompoundType,
  C extends CompoundType,
  D extends CompoundType,
  E extends CompoundType,
  F extends CompoundType,
>(a: A, b: B, c: C, d: D, e: E, f: F): InferCompoundValidator<A | B | C | D | E | F>

export function oneOf<A extends readonly any[]>(...args: A): Validator<A> // TODO infer [A,B] => A|B

export function oneOf(...args: any[]): Validator {
  // TODO
  void args
  return <any> null
}

/* -------------------------------------------------------------------------- */

export function allOf<
  A extends CompoundType,
>(a: A): InferCompoundValidator<A>

export function allOf<
  A extends CompoundType,
  B extends CompoundType,
>(a: A, b: B): InferCompoundValidator<A & B>

export function allOf<
  A extends CompoundType,
  B extends CompoundType,
  C extends CompoundType,
>(a: A, b: B, c: C): InferCompoundValidator<A & B & C>

export function allOf<
  A extends CompoundType,
  B extends CompoundType,
  C extends CompoundType,
  D extends CompoundType,
>(a: A, b: B, c: C, d: D): InferCompoundValidator<A & B & C & D>

export function allOf<
  A extends CompoundType,
  B extends CompoundType,
  C extends CompoundType,
  D extends CompoundType,
  E extends CompoundType,
>(a: A, b: B, c: C, d: D, e: E): InferCompoundValidator<A & B & C & D & E>

export function allOf<
  A extends CompoundType,
  B extends CompoundType,
  C extends CompoundType,
  D extends CompoundType,
  E extends CompoundType,
  F extends CompoundType,
>(a: A, b: B, c: C, d: D, e: E, f: F): InferCompoundValidator<A & B & C & D & E & F>

export function allOf<A extends readonly any[]>(...args: A): Validator<A> // TODO infer [A,B] => A&B

export function allOf(...args: any[]): Validator {
  // TODO
  void args
  return <any> null
}
