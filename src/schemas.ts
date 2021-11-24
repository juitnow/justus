import { any, AnyValidator } from './validators/any'
import { getValidator, isValidation } from './utilities'

import {
  AdditionalProperties,
  CombinedModifier,
  InferValidation,
  Modifier,
  Never,
  OptionalModifier,
  ReadonlyModifier,
  Validation,
  Validator,
  additionalValidator,
  modifierValidator,
} from './types'

/* ========================================================================== *
 * ADDITIONAL PROPERTIES IN SCHEMAS                                           *
 * ========================================================================== */


export type allowAdditionalProperties =
  (() => AdditionalProperties<AnyValidator>) &
  ((allow: true) => AdditionalProperties<AnyValidator>) &
  ((allow: false) => AdditionalProperties<never>) &
  (<V extends Validation>(validation: V) => AdditionalProperties<Validator<InferValidation<V>>>) &
  { [additionalValidator]: Validator<any> }

export const allowAdditionalProperties: allowAdditionalProperties = <allowAdditionalProperties>
  ((options?: Validation | boolean): AdditionalProperties<Validator> => {
    if (options === false) return {} as AdditionalProperties<never>

    const allow = options === true ? any : getValidator(options)
    return { [additionalValidator]: allow }
  })

allowAdditionalProperties[additionalValidator] = any


/* ========================================================================== *
 * SCHEMA KEYS MODIFIERS                                                      *
 * ========================================================================== */

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
export function readonly<V extends Validation>(validation: V): ReadonlyModifier<Validator<InferValidation<V>>>
export function readonly<M extends Modifier>(modifier: M): CombineModifiers<ReadonlyModifier, M>

export function readonly(options?: Modifier<any> | Validation): Modifier<any> {
  const { [modifierValidator]: modifier, optional = undefined } =
    isValidation(options) ? { [modifierValidator]: getValidator(options) } :
    options ? options : { [modifierValidator]: any }

  return optional ?
    { [modifierValidator]: modifier, optional, readonly: true } :
    { [modifierValidator]: modifier, readonly: true }
}

export function optional(): OptionalModifier<any>
export function optional<V extends Validation>(validation: V): OptionalModifier<Validator<InferValidation<V>>>
export function optional<M extends Modifier>(modifier: M): CombineModifiers<OptionalModifier, M>

export function optional(options?: Modifier<any> | Validation): Modifier<any> {
  const { [modifierValidator]: modifier, readonly = undefined } =
    isValidation(options) ? { [modifierValidator]: getValidator(options) } :
    options ? options : { [modifierValidator]: any }

  return readonly ?
    { [modifierValidator]: modifier, readonly, optional: true } :
    { [modifierValidator]: modifier, optional: true }
}

/* ========================================================================== *
 * NEVER PSEUDO-MODIFIER                                                      *
 * ========================================================================== */

export const never: Never = { never: true }

/* ========================================================================== *
 * INFER OBJECT TYPE FROM SCHEMA                                              *
 * ========================================================================== */
