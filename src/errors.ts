/* eslint-disable @typescript-eslint/ban-types */
export type ValidationErrors = { path: (string | number)[], message: string }[]

/** Combine the components of a _path_ into a human readable string */
function pathToString(path: (string | number)[]): string {
  return path.reduce((string: string, key, index): string => {
    if (typeof key === 'number') return `${string}[${key}]`
    return index === 0 ? key : `${string}.${key}`
  }, '')
}

/**
 * A `ValidationError` wraps one or more errors encountered during validation.
 */
export class ValidationError extends Error {
  /** An `Array` of validation errors encountered while validating */
  readonly errors!: ValidationErrors
  /** Our stack, always present as we enforce it in the constructor */
  readonly stack!: string

  /**
   * Create a new `ValidationError` instance from a `ValidationErrorBuilder`
   * or with a `cause` (a string, or another error) and optional path.
   *
   * The `constructor` (optional last parameter) will restrict creation of
   * this instance's stack up to the specified function.
   */
  constructor(builder: ValidationErrorBuilder)
  constructor(cause: any, constructor?: Function)
  constructor(cause: any, path: (string | number)[], constructor?: Function)

  constructor(
      builderOrCause: any,
      constructorOrPath?: Function | ((string | number)[]),
      maybeConstructor?: Function,
  ) {
    let constructor: Function
    let errors: ValidationErrors

    if (builderOrCause instanceof ValidationErrorBuilder) {
      errors = builderOrCause.errors
      constructor = builderOrCause.assert
    } else {
      const path = Array.isArray(constructorOrPath) ? constructorOrPath : []

      if (builderOrCause instanceof ValidationError) {
        errors = builderOrCause.errors.map(({ path: subpath, message }) =>
          ({ path: [ ...path, ...subpath ], message }))
      } else {
        errors = [ { path, message: `${builderOrCause}` } ]
      }

      constructor =
        typeof maybeConstructor === 'function' ? maybeConstructor :
        typeof constructorOrPath === 'function' ? constructorOrPath :
        ValidationError
    }

    const details = errors
        .map(({ path, message }) => ({ key: pathToString(path), message }))
        .map(({ key, message }) => key ? `${key}: ${message}` : message)
        .join('\n  ')

    const message = errors.length !== 1 ?
      `Found ${errors.length} validation errors` :
      'Found 1 validation error'

    super(`${message}\n  ${details}`)

    ;(Error as any).captureStackTrace?.(this, constructor)
    Object.defineProperty(this, 'errors', { value: errors })
  }
}

ValidationError.prototype.name = 'ValidationError'

/**
 * Helper class to build a `ValidationError` associated p
 */
export class ValidationErrorBuilder {
  /** The current list of validation errors */
  readonly errors: ValidationErrors = []

  /**
   * Record a validation error associated with the specified key.
   *
   * @param error - The error (normally a `string` or a `ValidationError`)
   *                to record and associate with the given key
   * @param key - The key in an object, or index in an array where the
   *              vaildation error was encountered
   */
  record(error: any, ...key: (string | number)[]): this {
    const path = [ ...key ]
    if (error instanceof ValidationError) {
      error.errors.forEach(({ path: subpath, message }) => {
        this.errors.push({ path: [ ...path, ...subpath ], message })
      })
    } else {
      this.errors.push({ path, message: `${error}` })
    }
    return this
  }

  /**
   * Assert there are no validation errors and return the specified value, or
   * throw a `ValidationError` combining all errors
   *
   * @param value - The value to return if no errors have been recorded
   */
  assert<T>(value: T): T {
    if (this.errors.length > 0) throw new ValidationError(this)
    return value
  }
}

/**
 * Simple assertion function throwing `ValidationError`(s) with an empty path
 */
export function assertValidation(what: boolean | undefined, message: string): asserts what {
  if (! what) throw new ValidationError(message, assertValidation)
}

/**
 * Simple assertion function throwing `TypeError`(s) to be used when
 * constructing a `Validator` from a `Schema` or validation constraints.
 */
export function assertSchema(what: boolean | undefined, message: string): asserts what {
  if (! what) throw new TypeError(message)
}
