import { InferValidationType, Validation } from './validation'
import { Validator } from './validator'
import { any, AnyValidator } from './primitives'
import { getValidator, isPrimitive } from './utilities'

export const allowAdditionalProperties = Symbol('additionalProperties')
type allowAdditionalProperties = typeof allowAdditionalProperties

/* ========================================================================== *
 * SCHEMA DEFINITION                                                          *
 * ========================================================================== */

export interface Schema {
  [ key: string ] : Validation | Modifier | Never
  [ allowAdditionalProperties ]?: Validator
}

/* ========================================================================== *
 * ADDITIONAL PROPERTIES IN SCHEMAS                                           *
 * ========================================================================== */

export interface AdditionalProperties<V extends Validator> {
  [ allowAdditionalProperties ]: V
}

export function additionalProperties(): AdditionalProperties<AnyValidator>
export function additionalProperties(allow: true): AdditionalProperties<AnyValidator>
export function additionalProperties(allow: false): AdditionalProperties<never>
export function additionalProperties<V extends Validation>(validation: V): AdditionalProperties<Validator<InferValidationType<V>>>
export function additionalProperties(options?: Validation | boolean): AdditionalProperties<Validator> {
  if (options === false) return {} as AdditionalProperties<never>

  const allow = options === true ? any : getValidator(options)
  return { [allowAdditionalProperties]: allow }
}


/* ========================================================================== *
 * SCHEMA KEYS MODIFIERS                                                      *
 * ========================================================================== */

interface Modifier<V extends Validator = Validator> {
  readonly?: true,
  optional?: true,
  modifier: V
}

interface ReadonlyModifier<V extends Validator = Validator> extends Modifier<V> {
  readonly: true,
}

interface OptionalModifier<V extends Validator = Validator> extends Modifier<V> {
  optional: true,
}

interface CombinedModifier<V extends Validator = Validator>
extends ReadonlyModifier<V>, OptionalModifier<V>, Modifier<V> {
  readonly: true,
  optional: true,
}

/* -------------------------------------------------------------------------- */

type CombineModifiers<M1 extends Modifier, M2 extends Modifier> =
  M1 extends ReadonlyModifier ?
    M2 extends ReadonlyModifier<infer V> ? ReadonlyModifier<V> :
    M2 extends OptionalModifier<infer V> ? CombinedModifier<V> :
    never :
  M1 extends OptionalModifier ?
    M2 extends ReadonlyModifier<infer V> ? CombinedModifier<V> :
    M2 extends OptionalModifier<infer V> ? OptionalModifier<V> :
    never :
  never

/* -------------------------------------------------------------------------- */

export function readonly(): ReadonlyModifier<any>
export function readonly<V extends Validation>(validation: V): ReadonlyModifier<Validator<InferValidationType<V>>>
export function readonly<M extends Modifier>(modifier: M): CombineModifiers<ReadonlyModifier, M>

export function readonly(modifier?: Modifier<any> | Validation): any {
  const validator =
    isPrimitive(modifier) ? getValidator(modifier) :
    modifier instanceof Validator ? modifier :
    modifier ? modifier : any

  return { modifier: validator, readonly: true }
}

export function optional(): OptionalModifier<any>
export function optional<V extends Validation>(validation: V): OptionalModifier<Validator<InferValidationType<V>>>
export function optional<M extends Modifier>(modifier: M): CombineModifiers<OptionalModifier, M>

export function optional(modifier?: Modifier<any> | Validation): any {
  const validator =
    isPrimitive(modifier) ? getValidator(modifier) :
    modifier instanceof Validator ? modifier :
    modifier ? modifier : any

  return { modifier: validator, optional: true }
}

/* ========================================================================== *
 * NEVER PSEUDO-MODIFIER                                                      *
 * ========================================================================== */

interface Never {
  never: true
}

export const never: Never = { never: true }

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
    S[key] extends Validation ? InferValidationType<S[key]> :
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
    S[key] extends ReadonlyModifier<infer V> ? InferValidationType<V> : never
}

type InferOptionalModifiers<S extends Schema> = {
  [ key in keyof S as
    key extends string ?
      S[key] extends ReadonlyModifier<Validator> ? never :
      S[key] extends OptionalModifier<Validator> ? key :
      never :
    never
  ] ? :
    S[key] extends OptionalModifier<infer V> ? InferValidationType<V> : never
}

type InferCombinedModifiers<S extends Schema> = {
  readonly [ key in keyof S as
    key extends string ?
      S[key] extends CombinedModifier ? key :
      never :
    never
  ] ? :
    S[key] extends CombinedModifier<infer V> ? InferValidationType<V> : never
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
