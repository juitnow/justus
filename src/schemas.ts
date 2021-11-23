import { InferValidationType, Validation } from './validation'
import { Validator } from './validator'
import { any, AnyValidator } from './validators/any'
import { getValidator, isValidation } from './utilities'
import { Tuple } from './tuples'

export const additionalProperties = Symbol('additionalProperties')
type additionalProperties = typeof additionalProperties

/* ========================================================================== *
 * SCHEMA DEFINITION                                                          *
 * ========================================================================== */

export interface Schema {
  [ key: string ] : Validation | Tuple | Modifier | Never
  [ additionalProperties ]?: Validator
}

/* ========================================================================== *
 * ADDITIONAL PROPERTIES IN SCHEMAS                                           *
 * ========================================================================== */

export interface AdditionalProperties<V extends Validator> {
  [ additionalProperties ]: V
}

export type allowAdditionalProperties =
  (() => AdditionalProperties<AnyValidator>) &
  ((allow: true) => AdditionalProperties<AnyValidator>) &
  ((allow: false) => AdditionalProperties<never>) &
  (<V extends Validation>(validation: V) => AdditionalProperties<Validator<InferValidationType<V>>>) &
  { [additionalProperties]: Validator<any> }

export const allowAdditionalProperties: allowAdditionalProperties = <allowAdditionalProperties>
  ((options?: Validation | boolean): AdditionalProperties<Validator> => {
    if (options === false) return {} as AdditionalProperties<never>

    const allow = options === true ? any : getValidator(options)
    return { [additionalProperties]: allow }
  })

allowAdditionalProperties[additionalProperties] = any


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

export function readonly(options?: Modifier<any> | Validation): Modifier<any> {
  const { modifier, optional = undefined } =
    isValidation(options) ? { modifier: getValidator(options) } :
    options ? options : { modifier: any }

  return optional ?
    { modifier, optional, readonly: true } :
    { modifier, readonly: true }
}

export function optional(): OptionalModifier<any>
export function optional<V extends Validation>(validation: V): OptionalModifier<Validator<InferValidationType<V>>>
export function optional<M extends Modifier>(modifier: M): CombineModifiers<OptionalModifier, M>

export function optional(options?: Modifier<any> | Validation): Modifier<any> {
  const { modifier, readonly = undefined } =
    isValidation(options) ? { modifier: getValidator(options) } :
    options ? options : { modifier: any }

  return readonly ?
    { modifier, readonly, optional: true } :
    { modifier, optional: true }
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
