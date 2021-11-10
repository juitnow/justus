/**
 * The `Validator` interface defines an object capable of validating a given
 * _value_ and (possibly) converting it the required `Type`.
 */
export interface Validator<T = any> {
  /**
   * Validate a _value_ and optionally convert it to the required `Type`.
   *
   * @param value - The _value_ to validate
   * @returns The validated _value_, optionally converted to the reqired `Type`
   */
  validate: (value: any) => T,
}

/** The `Validation` type defines a `Validator` or a function creating one. */
type Validation<V extends Validator = Validator> = V | (() => V)

/** Infer the type returned by a `Validator`'s own `validate` function. */
type InferValidationType<V extends Validation | null> =
  V extends () => ObjectValidator ? Record<string, any> :
  V extends ObjectValidator ? Record<string, any> :
  V extends () => Validator<infer T> ? T :
  V extends Validator<infer T> ? T :
  null


/* ========================================================================== *
 * BASIC VALIDATION (ANY, NULL)                                               *
 * ========================================================================== */

/** The utility `Validator` for `any` type. */
const anyValidator: Validator = {
  validate(value: any): any {
    return value
  },
}

/** A function returning a `Validator` for `any` type. */
export function any(): Validator {
  return anyValidator
}

/* ========================================================================== */

/** The utility `Validator` for the `null` type. */
const nullValidator: Validator<null> = {
  validate(value: any): null {
    if (value === null) return null
    throw new TypeError('Not "null"')
  },
}


/* ========================================================================== *
 * PRIMITIVE VALIDATION (BOOLEAN, NUMBER, STRING)                             *
 * ========================================================================== */

/** The utility `Validator` for the `boolean` type. */
const booleanValidator: Validator<boolean> = {
  validate: (value: any): boolean => {
    if (typeof value === 'boolean') return value
    throw new TypeError('Not a "boolean"')
  },
}

/** A function returning a `Validator` for the `boolean` type. */
export function boolean(): Validator<boolean>
export function boolean<B extends boolean>(): Validator<B>
export function boolean(): Validator<boolean> {
  return booleanValidator
}

/* ========================================================================== */

/**
 * Constraints to validate a `number` with.
 * @internal
 */
interface NumberConstraints {
  /** The value for which a `number` must be multiple of for it to be valid */
  multipleOf?: number,
  /** The _inclusive_ maximum value for a valid `number`: `value <= maximum` */
  maximum?: number,
  /** The _inclusive_ minimum value for a valid `number`: `value >= minimum` */
  minimum?: number,
  /** The _exclusive_ maximum value for a valid `number`: `value < exclusiveMaximum` */
  exclusiveMaximum?: number,
  /** The _exclusive_ minimum value for a valid `number`: `value > exclusiveMaximum` */
  exclusiveMinumum?: number,
}

/**
 * A function returning a `Validator` for the `number` type.
 *
 * @param constraints - Optional constraints to validate the `number` with.
 */
export function number(constraints?: NumberConstraints): Validator<number>
export function number<N extends number>(constraints?: NumberConstraints): Validator<N>
export function number(constraints?: NumberConstraints): Validator<number> {
  // TODO: implement me!
  void constraints
  return <any> null
}

/* ========================================================================== */

/** Constraints to validate a `string` with. */
interface StringConstraints {
  /** The _maximum_ length of a valid `string`: `value.length <= maxLength` */
  maxLength?: number,
  /** The _minimum_ length of a valid `string`: `value.length >= minLength` */
  minLength?: number,
  /** A `RegExp` enforcing a particular pattern for a valid `string`: `pattern.test(value)` */
  pattern?: RegExp,
}

/**
 * A function returning a `Validator` for the `string` type.
 *
 * @param constraints - Optional constraints to validate the `string` with.
 */
export function string(constraints?: StringConstraints): Validator<string>
export function string<S extends string>(constraints?: StringConstraints): Validator<S>
export function string(constraints?: StringConstraints): Validator<string> {
  // TODO: implement me!
  void constraints
  return <any> null
}


/* ========================================================================== *
 * ARRAY VALIDATION                                                           *
 * ========================================================================== */

/** Constraints to validate an `Array` with. */
interface ArrayConstraints<V extends Validation | null> {
  /** The _maximum_ number of elements a valid `Array`: `value.length <= maxItems` */
  maxItems?: number,
  /** The _minimum_ number of elements a valid `Array`: `value.length >= minItems` */
  minItems?: number,
  /** A flag indicating whether an `Array`'s elements must be unique */
  uniqueItems?: boolean,
  /** A `Validator` validating each individual item in an `Array` */
  items?: V,
}

/* -------------------------------------------------------------------------- */

/**
 * A function returning a `Validator` for an `Array` containing `any` item.
 */
export function array(): Validator<any[]>

/**
 * A function returning a `Validator` for an `Array`.
 *
 * @param validation - A `Validator` (or generator thereof) validating each
 *                     of the _items_ in the `Array`
 */
export function array<V extends Validation | null>(validation: V): Validator<InferValidationType<V>[]>

/**
 * A function returning a `Validator` for an `Array`.
 *
 * @param constraints - Optional constraints to validate the `Array` with.
 */
export function array<V extends Validation | null>(constraints: ArrayConstraints<V>): Validator<InferValidationType<V>[]>

// Overloaded `array(...)` function
export function array(options?: Validation | ArrayConstraints<Validation | null> | null): Validator<any[]> {
  // Extract `items` and the rest of the constraints from options
  const { items, ...constraints } =
    // Specifically "null" means validate Array<null>
    options === null ? { items: nullValidator } :
    // Specifically "undefined" means validate Array<any>
    options === undefined ? { items: anyValidator } :
    // If options is a function, it generates an items validator
    typeof options === 'function' ? { items: options() } :
    // If options has a `validate` key, then it's a `Validator`
    'validate' in options ? { items: options } :
    // Anything else should be an "constraints" instance
    options

  // Our `items` above can be a `Validator` or a function creating one
  const validator = typeof items === 'function' ? items() : items
  void validator, constraints

  // TODO: implement me!
  return <any> null
}

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

const allowAdditionalProperties = Symbol('additionalProperties')
type allowAdditionalProperties = typeof allowAdditionalProperties

interface Schema {
  [ key: string ] : Validation | Modifier | null
  [ allowAdditionalProperties ]?: Validator | boolean
}

interface SchemaValidator<T, S extends Schema> extends Validator<T> {
  schema: S
}

interface ObjectValidator extends SchemaValidator<Record<string, any>, {}> {
  [ allowAdditionalProperties ]: true
}

/* -------------------------------------------------------------------------- */

export function object(): ObjectValidator // <any, undefined>
export function object<S extends Schema>(schema: S): SchemaValidator<InferSchema<S>, S>
export function object<S extends Schema>(schema?: S): SchemaValidator<InferSchema<S>, S> {
  return {
    schema: <S> schema,
    validate: (value: any): InferSchema<S> => {
      return value
    },
  }
}

/* -------------------------------------------------------------------------- *
 * Schema Extraction                                                          *
 * -------------------------------------------------------------------------- */

/** Infer the type of keys associated with `Validator`s */
type InferValidators<S extends Schema> = {
  [ key in keyof S as
      key extends string ?
        S[key] extends Validation | null ? key :
        never :
      never
  ] :
    S[key] extends Validation | null ? InferValidationType<S[key]> : never
}

type InferReadonlyModifiers<S extends Schema> = {
  readonly [ key in keyof S as
    key extends string ?
      S[key] extends OptionalModifier<Validator> ? never :
      S[key] extends ReadonlyModifier<Validator> ? key :
      never :
    never
  ] :
    S[key] extends Modifier<infer V> ? InferValidationType<V> : never
}

type InferOptionalModifiers<S extends Schema> = {
  [ key in keyof S as
    key extends string ?
      S[key] extends ReadonlyModifier<Validator> ? never :
      S[key] extends OptionalModifier<Validator> ? key :
      never :
    never
  ] ? :
    S[key] extends Modifier<infer V> ? InferValidationType<V> : never
}

type InferCombinedModifiers<S extends Schema> = {
  readonly [ key in keyof S as
    key extends string ?
      S[key] extends CombinedModifier ? key :
      never :
    never
  ] ? :
    S[key] extends Modifier<infer V> ? InferValidationType<V> : never
}

type InferAdditionaProperties<S extends Schema> =
  S extends { [ allowAdditionalProperties ]: Validator<infer V> } ? Record<string, V> :
  S extends { [ allowAdditionalProperties ]: true } ? Record<string, any> :
  {}

/** Infer the type validated by a `Schema` */
type InferSchema<S extends Schema> =
  InferValidators<S> &
  InferReadonlyModifiers<S> &
  InferOptionalModifiers<S> &
  InferCombinedModifiers<S> &
  InferAdditionaProperties<S>

/* -------------------------------------------------------------------------- *
 * Schema additions for extra properties                                      *
 * -------------------------------------------------------------------------- */

interface AdditionalProperties<V extends Validator | boolean> {
  [ allowAdditionalProperties ]: V
}

export function additionalProperties(): AdditionalProperties<true>
export function additionalProperties(allow: true): AdditionalProperties<true>
export function additionalProperties(allow: false): AdditionalProperties<false>
export function additionalProperties(allow: null): AdditionalProperties<Validator<null>>
export function additionalProperties<V extends Validation>(validation: V): AdditionalProperties<Validator<InferValidationType<V>>>
export function additionalProperties(allow?: null | boolean | Validation): AdditionalProperties<Validator | boolean> {
  return { [allowAdditionalProperties]:
    typeof allow === 'function' ? allow() :
    allow === null ? nullValidator :
    allow === undefined ? true :
    allow,
  }
}

/* -------------------------------------------------------------------------- *
 * Schema modifiers                                                           *
 * -------------------------------------------------------------------------- */

interface Modifier<V extends Validator = Validator> {
  validator: V
  readonly?: true,
  optional?: true,
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

export function readonly(): ReadonlyModifier<any>
export function readonly<V extends Validation | null>(validation: V): ReadonlyModifier<Validator<InferValidationType<V>>>
export function readonly<M extends Modifier>(modifier: M): CombineModifiers<ReadonlyModifier, M>

export function readonly(modifier?: Modifier<any> | Validation): any {
  void modifier
  return <any> null
}

export function optional(): OptionalModifier<any>
export function optional<V extends Validation | null>(validation: V): OptionalModifier<Validator<InferValidationType<V>>>
export function optional<M extends Modifier>(modifier: M): CombineModifiers<OptionalModifier, M>

export function optional(modifier?: Modifier<any> | Validation): any {
  void modifier
  return <any> null
}

const a = readonly(string)
const b = optional(a)
const a1 = optional(number)
const b1 = readonly(a1)

a.readonly
a.optional
b.readonly
b.optional
const c = b.validator.validate(null)

a1.readonly
a1.optional
b1.readonly
b1.optional
const c1 = b.validator.validate(null)

// /**
//  * A schema addition allowing extra properties in an `Object`.
//  *
//  * Any extra key found in the object will be allowed and its value will be
//  * returned unmodified and typed with `any`.
//  */
// export const allowExtraProperties = { [extraProperties]: 'allow' } as const

// /**
//  * A schema addition forbidding extra properties in an `Object` (default).
//  *
//  * Any extra key found in the object will be forbidden and will trigger a
//  * validation error.
//  */
// export const forbidExtraProperties = { [extraProperties]: 'forbid' } as const

// /**
//  * A schema addition ignoring extra properties in an `Object`.
//  *
//  * Any extra key found in the object will be ignored and its value stripped
//  * from the resulting object.
//  */
// export const ignoreExtraProperties = { [extraProperties]: 'ignore' } as const

// /* -------------------------------------------------------------------------- *
//  * Optional Keys for Objects                                                  *
//  * -------------------------------------------------------------------------- */

// /** The `Optional` interface marks an _optional_ key in a `Schema`. */
// interface Optional<V extends Validator = Validator> {
//   optional: V,
// }

// /**
//  * A function returning an `Optional` validating `any` type.
//  */
// export function optional(): Optional

// /**
//  * A function returning an `Optional` validating the `null` type.
//  */
// export function optional(validator: null): Optional<Validator<null>>

// /**
//  * A function returning an `Optional` using the specified `Validator`.
//  */
// export function optional<V extends Validator>(validator: V): Optional<V>

// /**
//  * A function returning an `Optional` using the `Validator` returned by the
//  * specified function.
//  */
// export function optional<V extends Validator>(validator: () => V): Optional<V>

// // Overloaded `optional(...)` function
// export function optional<V extends Validator>(options?: V | (() => V) | null): Optional<V | Validator | Validator<null>> {
//   const optional =
//     options === null ? nullValidator :
//     options === undefined ? anyValidator :
//     typeof options === 'function' ? options() :
//     'validate' in options ? options :
//     undefined

//   if (! optional) throw new TypeError('Wrong optional validation validator')

//   return { optional }
// }

// /* ========================================================================== *
//  * EXTRA VALIDATORS                                                           *
//  * ========================================================================== */

// /** Constraints to validate a `Date` with. */
// interface DateConstraints {
//   /** The minimum value for a valid `Date`: `value.getTime() >= new Date(from).getTime()` */
//   from?: number | Date | string,
//   /** The maximum value for a valid `Date`: `value.getTime() <= new Date(until).getTime()` */
//   until?: number | Date | string,
// }

// export function date(constraints?: DateConstraints): Validator<Date> {
//   // TODO: implement me!
//   void constraints
//   return <any> null
// }


// const o = object({
//   testO: object,
//   testOO: optional(object),
//   testN: number,
//   testA: any,
// })

// const p = o.validate(null)
// p.testO.fxxx
// p.testOO
// p.testN
// p.testA
