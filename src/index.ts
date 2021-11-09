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

/** Extract the `Type` returned by a `Validator`'s own `validate` function. */
type ValidatorType<V extends Validator> =
  V extends Validator<infer T> ? T : never

/* ========================================================================== *
 * BASIC VALIDATION (NULL, ANY, BOOLEAN, STRING, NUMBER)                      *
 * ========================================================================== */

/** The utility `Validator` for the `null` type. */
const nullValidator: Validator<null> = {
  validate(value: any): null {
    if (value === null) return null
    throw new TypeError('Not "null"')
  },
}

/* ========================================================================== */

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

/** The utility `Validator` for the `boolean` type. */
const booleanValidator: Validator<boolean> = {
  validate: (value: any): boolean => {
    if (typeof value === 'boolean') return value
    throw new TypeError('Not a "boolean"')
  },
}

/** A function returning a `Validator` for the `boolean` type. */
export function boolean(): Validator<boolean> {
  return booleanValidator
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
export function string<S extends string>(constraints?: StringConstraints): Validator<S> {
  // TODO: implement me!
  void constraints

  return {
    validate: (value: any): S => {
      if (typeof value === 'string') return <S> value
      throw new TypeError('Not a "string"')
    },
  }
}

/* ========================================================================== */

/** Constraints to validate a `number` with. */
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
export function number(constraints?: NumberConstraints): Validator<number> {
  // TODO: implement me!
  void constraints

  return {
    validate: (value: any): number => {
      if (typeof value === 'number') return value
      throw new TypeError('Not a "number"')
    },
  }
}

/* ========================================================================== *
 * ARRAY VALIDATION                                                           *
 * ========================================================================== */

/** Constraints to validate an `Array` with. */
interface ArrayConstraints<V extends Validator> {
  /** The _maximum_ number of elements a valid `Array`: `value.length <= maxItems` */
  maxItems?: number,
  /** The _minimum_ number of elements a valid `Array`: `value.length >= minItems` */
  minItems?: number,
  /** A flag indicating whether an `Array`'s elements must be unique */
  uniqueItems?: boolean,
  /** A `Validator` validating each individual item in an `Array` */
  items?: V | (() => V) | null,
}

/* -------------------------------------------------------------------------- */

/**
 * A function returning a `Validator` for an `Array` containing `any` item.
 */
export function array(): Validator<any[]>

/**
 * A function returning a `Validator` for an `Array` containing only `null`s.
 */
export function array(validator: null): Validator<null[]>

/**
 * A function returning a `Validator` for an `Array`.
 *
 * @param validator - A `Validator` validating each of the _items_ in the `Array`
 */
export function array<V extends Validator>(validator: V): Validator<ValidatorType<V>[]>

/**
 * A function returning a `Validator` for an `Array`.
 *
 * @param validator - A function returning a `Validator` validating each of the _items_ in the `Array`
 */
export function array<V extends Validator>(validator: () => V): Validator<ValidatorType<V>[]>

/**
 * A function returning a `Validator` for an `Array`.
 *
 * @param constraints - Optional constraints to validate the `Array` with.
 */
export function array<V extends Validator>(constraints: ArrayConstraints<V>): Validator<ValidatorType<V>[]>

// Overloaded `array(...)` function
export function array<V extends Validator>(options?: V | (() => V) | ArrayConstraints<V> | null): Validator<any[]> {
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
    // If options has a `items` key, then it's an `ArrayOptions`
    'items' in options ? options :
    // We should never get here with proper types, but...
    { items: undefined }

  // Our `items` above can be a `Validator` or a function creating one
  const validator = typeof items === 'function' ? items() : items
  void validator, constraints

  return {
    validate: (value: any): ValidatorType<V>[] => {
      // TODO: implement me!
      void value
      return <any> null
    },
  }
}

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

/**
 * A unique symbol used as a key in our `Schema` whose associated value
 * indicates how extra properties are handled.
 */
const extraProperties = Symbol('extraProperties')
 /** The type ouf our `extraProperties` symbol */
 type extraProperties = typeof extraProperties

 /** The `Schema` interface describes how an `Object` is validated. */
 interface Schema {
   /** Each key (a `string`) defines its own validation method */
   [ key: string ] :
     Validator | (() => Validator) | // validator for the key
     Optional | (() => Optional) | // declare key as optional with validator
     readonly any[] | // an enum of const values
     null // the "null" type

   /** Instruct the validator how to treat extra properties (default: `forbid`) */
   [ extraProperties ]? : 'allow' | 'forbid' | 'ignore'
}

/** The `SchemaValidator` defines a `Validator` associated with a `Schema`. */
interface SchemaValidator<T, S extends Schema | undefined> extends Validator<T> {
   schema: S
}

interface NoSchemaValidator extends SchemaValidator<any, {}> {
  [ extraProperties ]? : 'allow'
}

/* -------------------------------------------------------------------------- *
 * Schema Extraction                                                          *
 * -------------------------------------------------------------------------- */

/** Infer the type of keys associated with `Validator`s */
type InferValidators<S extends Schema> = {
  [ key in keyof S as
    S[key] extends () => NoSchemaValidator ? key :
    S[key] extends () => Validator ? key :
    S[key] extends Validator ? key :
    never
  ] :
  S[key] extends () => NoSchemaValidator ? Record<string, any> :
  S[key] extends () => Validator<infer T> ? T :
  S[key] extends Validator<infer T> ? T :
  never
}

/** Infer the type of (optional) keys associated `Optional`s */
type InferOptionals<S extends Schema> = {
  [ key in keyof S as
    S[key] extends () => Optional ? key :
    S[key] extends Optional ? key :
    never
  ] ? :
  S[key] extends () => Optional<infer V> ? ValidatorType<V> :
  S[key] extends Optional<infer V> ? ValidatorType<V> :
  never
}

/** Infer the type of keys associated `null`s */
type ExtractNulls<S extends Schema> = {
  [ key in keyof S as S[key] extends null ? key : never ] : null
}

/** Infer the type of `Array` members (remark: enum types) */
type InferEnumMemberType<T> =
  T extends (() => Validator<infer T1>) ? T1 :
  T extends Validator<infer T2> ? T2 :
  T

/** Combine the types of `Array` members (remark: combine enum types) */
type InferEnumType<E> =
  E extends readonly [ infer T, ...infer M ] ? InferEnumMemberType<T> | InferEnumType<M> :
  E extends Array<infer T> ? InferEnumMemberType<T> :
  never

/** Infer the type of keys associated `Array`s (remark: enumerations) */
type InferEnums<S extends Schema> = {
  [ key in keyof S as
    S[key] extends readonly any[] ? key :
    never
  ] : InferEnumType<S[key]>
}

/** Infer whether the `Schema` allows extra properties to be returned */
type InferAllowExtraProperties<S extends Schema> =
  S[extraProperties] extends 'allow' ? Record<string, any> : {}

/** Infer the type validated by a `Schema` */
type InferSchema<S> =
  S extends Schema ?
    InferAllowExtraProperties<S> &
    InferOptionals<S> &
    InferValidators<S> &
    ExtractNulls<S> &
    InferEnums<S> :
  S extends undefined ?
    any :
  never

/* -------------------------------------------------------------------------- */

/**
  * A function returning a `Validator` for an `Object` not conforming to any `Schema`.
  */
export function object(): NoSchemaValidator // <any, undefined>

/**
  * A function returning a `Validator` for an `Object` conforming to a `Schema`.
  *
  * @param schema A `Schema` defining the keys to be validated in the `Object`
  */
export function object<S extends Schema | undefined>(schema: S): SchemaValidator<InferSchema<S>, S>

// Overloaded `object(...)` function
export function object<S extends Schema>(schema?: S): SchemaValidator<InferSchema<S>, S> {
  return {
    schema: <S> schema,
    validate: (value: any): InferSchema<S> => {
      return value
    },
  }
}

/* -------------------------------------------------------------------------- *
 * Schema additions for extra properties                                      *
 * -------------------------------------------------------------------------- */

/**
 * A schema addition allowing extra properties in an `Object`.
 *
 * Any extra key found in the object will be allowed and its value will be
 * returned unmodified and typed with `any`.
 */
export const allowExtraProperties = { [extraProperties]: 'allow' } as const

/**
 * A schema addition forbidding extra properties in an `Object` (default).
 *
 * Any extra key found in the object will be forbidden and will trigger a
 * validation error.
 */
export const forbidExtraProperties = { [extraProperties]: 'forbid' } as const

/**
 * A schema addition ignoring extra properties in an `Object`.
 *
 * Any extra key found in the object will be ignored and its value stripped
 * from the resulting object.
 */
export const ignoreExtraProperties = { [extraProperties]: 'ignore' } as const

/* -------------------------------------------------------------------------- *
 * Optional Keys for Objects                                                  *
 * -------------------------------------------------------------------------- */

/** The `Optional` interface marks an _optional_ key in a `Schema`. */
interface Optional<V extends Validator = Validator> {
  optional: V,
}

/**
 * A function returning an `Optional` validating `any` type.
 */
export function optional(): Optional

/**
 * A function returning an `Optional` validating the `null` type.
 */
export function optional(validator: null): Optional<Validator<null>>

/**
 * A function returning an `Optional` using the specified `Validator`.
 */
export function optional<V extends Validator>(validator: V): Optional<V>

/**
 * A function returning an `Optional` using the `Validator` returned by the
 * specified function.
 */
export function optional<V extends Validator>(validator: () => V): Optional<V>

// Overloaded `optional(...)` function
export function optional<V extends Validator>(options?: V | (() => V) | null): Optional<V | Validator | Validator<null>> {
  const optional =
    options === null ? nullValidator :
    options === undefined ? anyValidator :
    typeof options === 'function' ? options() :
    'validate' in options ? options :
    undefined

  if (! optional) throw new TypeError('Wrong optional validation validator')

  return { optional }
}

/* ========================================================================== *
 * EXTRA VALIDATORS                                                           *
 * ========================================================================== */

/** Constraints to validate a `Date` with. */
interface DateConstraints {
  /** The minimum value for a valid `Date`: `value.getTime() >= new Date(from).getTime()` */
  from?: number | Date | string,
  /** The maximum value for a valid `Date`: `value.getTime() <= new Date(until).getTime()` */
  until?: number | Date | string,
}

export function date(constraints?: DateConstraints): Validator<Date> {
  // TODO: implement me!
  void constraints
  return <any> null
}


const o = object({
  testO: object,
  testOO: optional(object),
  testN: number,
  testA: any,
})

const p = o.validate(null)
p.testO.fxxx
p.testOO
p.testN
p.testA
