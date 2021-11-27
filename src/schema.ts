import { any } from './validators/any'
import { getValidator } from './utilities'

import {
  AdditionalProperties,
  CombinedModifier,
  InferValidation,
  Modifier,
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

function _allowAdditionalProperties(): AdditionalProperties<Validator<any>>
function _allowAdditionalProperties(allow: true): AdditionalProperties<Validator<any>>
function _allowAdditionalProperties(allow: false): AdditionalProperties<false>
function _allowAdditionalProperties<V extends Validation>(validation: V): AdditionalProperties<Validator<InferValidation<V>>>

function _allowAdditionalProperties(options?: Validation | boolean): AdditionalProperties<Validator | false> {
  if (options === false) return { [additionalValidator]: false }
  if (options === true) return { [additionalValidator]: any }

  return { [additionalValidator]: getValidator(options) }
}

export const allowAdditionalProperties = _allowAdditionalProperties as
  typeof _allowAdditionalProperties & AdditionalProperties<Validator<any>>

allowAdditionalProperties[additionalValidator] = any


/* ========================================================================== *
 * SCHEMA KEYS MODIFIERS                                                      *
 * ========================================================================== */

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

export function isModifier(what: any): what is Modifier<any> {
  return (what && (typeof what === 'object') && (modifierValidator in what))
}

/* -------------------------------------------------------------------------- */

export function readonly(): ReadonlyModifier<any>
export function readonly<V extends Validation>(validation: V): ReadonlyModifier<Validator<InferValidation<V>>>
export function readonly<M extends Modifier>(modifier: M): CombineModifiers<ReadonlyModifier, M>

export function readonly(options?: Modifier | Validation): Modifier {
  const { [modifierValidator]: validation = any, optional = false } =
    isModifier(options) ? options : { [modifierValidator]: options }

  const validator = getValidator(validation)

  return optional ?
    { [modifierValidator]: validator, optional, readonly: true } :
    { [modifierValidator]: validator, readonly: true }
}

export function optional(): OptionalModifier<any>
export function optional<V extends Validation>(validation: V): OptionalModifier<Validator<InferValidation<V>>>
export function optional<M extends Modifier>(modifier: M): CombineModifiers<OptionalModifier, M>

export function optional(options?: Modifier<any> | Validation): Modifier<any> {
  const { [modifierValidator]: validation = any, readonly = false } =
    isModifier(options) ? options : { [modifierValidator]: options }

  const validator = getValidator(validation)

  return readonly ?
    { [modifierValidator]: validator, readonly, optional: true } :
    { [modifierValidator]: validator, optional: true }
}
