import type { Validator } from './validation'

/* ========================================================================== *
 * BASIC VALIDATION (ANY, BOOLEANS)                                           *
 * ========================================================================== */

/**
 * The utility `Validator` for `any` type.
 *
 * @public
 */
export const any: Validator<any> = {
  // TODO
  validate: () => <any> null,
}

/**
 * The utility `Validator` for `boolean`s.
 *
 * @public
 */
export const boolean: Validator<boolean> = {
  // validate: (value, context): asserts value is boolean => {
  //   if (typeof value === 'boolean') return true
  //   context.fail('Value is not a "boolean"')
  //   return false
  // },
  // TODO
  validate: () => <any> null,
}


/* ========================================================================== *
 * BRANDED NUMBERS VALIDATION                                                 *
 * ========================================================================== */

/**
 * Constraints to validate a `number` with.
 */
export interface NumberConstraints {
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
  /** Whether to allow `NaN` or not (default: `false`) */
  allowNaN?: boolean,
}

/**
 * A function returning a `Validator` for `number`s.
 *
 * @param constraints - Optional constraints to validate the `number` with.
 * @public
 */
export function number(constraints?: NumberConstraints): Validator<number>
export function number<N extends number>(constraints?: NumberConstraints): Validator<N>
export function number(constraints: NumberConstraints = {}): Validator<number> {
  // let isMultipleOf: undefined | ((value: number) => boolean)

  // const {
  //   multipleOf,
  //   maximum = Number.POSITIVE_INFINITY,
  //   minimum = Number.NEGATIVE_INFINITY,
  //   exclusiveMaximum,
  //   exclusiveMinumum,
  //   allowNaN,
  // } = xconstraints

  // if (multipleOf !== undefined) {
  //   if (multipleOf <= 0) {
  //     throw new TypeError(`Constraint "multipleOf" must be greater than zero: ${multipleOf}`)
  //   }

  //   // Split the multiple of in integer and fraction
  //   const integer = Math.trunc(multipleOf) // 1.05 -> 1.00
  //   const fraction = multipleOf - integer //  1.05 -> 0.05

  //   if (fraction === 0) {
  //     // Easy case is when we only have to deal with integers...
  //     isMultipleOf = (value): boolean => ! (value % multipleOf)
  //   } else if (fraction >= 0.000001) {
  //     // We have some "fractional" part (max 6 decimal digits), multiply...
  //     const bigMultipleOf = Math.trunc(multipleOf * 1000000)
  //     isMultipleOf = (value): boolean => ! (Math.trunc(value * 1000000) % bigMultipleOf)
  //   } else {
  //     // Required precision was too much (more than 6 decimal digits)
  //     throw new TypeError(`Constraint "multipleOf" requires too much precision: ${multipleOf}`)
  //   }
  // }

  // return {
  //   validate(value, context): value is number {
  //     if (typeof value !== 'number') {
  //       return context.fail('Not a "number"')
  //     }

  //     if (isNaN(value) && (! allowNaN)) {
  //       return context.fail('Number is "NaN"')
  //     }

  //     if (value < minimum) {
  //       return context.fail(`Number is less than ${minimum}`)
  //     }

  //     if (value > maximum) {
  //       return context.fail(`Number is greater than ${minimum}`)
  //     }

  //     if ((exclusiveMinumum !== undefined) && (value <= exclusiveMinumum)) {
  //       return context.fail(`Number is less than or equal to ${exclusiveMinumum}`)
  //     }

  //     if ((exclusiveMaximum !== undefined) && (value >= exclusiveMaximum)) {
  //       return context.fail(`Number is greater than or equal to ${exclusiveMaximum}`)
  //     }

  //     if (isMultipleOf && (! isMultipleOf(value))) {
  //       return context.fail(`Number is not multiple of ${multipleOf}`)
  //     }

  //     return true
  //   },
  // }
  // TODO
  void constraints
  return <any> null
}

/* ========================================================================== *
 * BRANDED STRINGS VALIDATION                                                 *
 * ========================================================================== */

/** Constraints to validate a `string` with. */
export interface StringConstraints {
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
 * @public
 */
export function string(constraints?: StringConstraints): Validator<string>
export function string<S extends string>(constraints?: StringConstraints): Validator<S>
export function string(constraints: StringConstraints = {}): Validator<string> {
  // const {
  //   minLength = 0,
  //   maxLength = Number.MAX_SAFE_INTEGER,
  //   pattern,
  // } = constraints

  // if (minLength < 0) {
  //   throw new TypeError(`Constraint "minLength" must be non-negative: ${minLength}`)
  // }

  // if (maxLength < 0) {
  //   throw new TypeError(`Constraint "maxLength" must be non-negative: ${maxLength}`)
  // }

  // return {
  //   validate(value, { fail }): value is string {
  //     if (typeof value !== 'string') return fail('Not a "string"')

  //     if (value.length < minLength) {
  //       return fail(`String must have a minimum length of ${minLength}`)
  //     }

  //     if (value.length > maxLength) {
  //       return fail(`String must have a maximum length of ${maxLength}`)
  //     }

  //     if (pattern && (! pattern.test(value))) {
  //       return fail(`String does not match required pattern ${pattern}`)
  //     }

  //     return true
  //   },
  // }
  // TODO
  void constraints
  return <any> null
}


/* ========================================================================== *
 * CONSTANTS VALIDATION                                                       *
 * ========================================================================== */

/**
 * Create a `Validator` validating the specified constant.
 *
 * @public
 */
export function constant<T extends string | number | boolean | null>(constant: T): Validator<T> {
  // return {
  //   validate(value, { fail }): value is T {
  //     if (value !== constant) {
  //       return fail(`Value does not match constant ${constant}`)
  //     }
  //     return true
  //   },
  // }
  // TODO
  void constant
  return <any> null
}
