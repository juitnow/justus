import { ValidationOptions } from './validation'
// import { assert } from './utilities'

type ValidationErrors = { key: string, message: string }[]

/** Simple assertion function */
export function assert(what: boolean | undefined, message: string): asserts what {
  if (! what) throw new TypeError(message)
}

export class ValidationError extends Error {
  readonly errors!: ValidationErrors

  constructor(message: string, constructor?: Function)
  constructor(errors: ValidationErrors, constructor?: Function)
  constructor(errors: ValidationErrors | string, constructor?: Function) {
    if (typeof errors === 'string') errors = [ { key: '', message: errors } ]

    const details = errors
        .map(({ key, message }) => key ? `${key}: ${message}` : message)
        .join('\n  ')
    const message = errors.length !== 1 ?
      `Found ${errors.length} validation errors` :
      'Found 1 validation error'

    super(`${message}\n  ${details}`)

    Error.captureStackTrace(this, constructor || ValidationError)
    Object.defineProperty(this, 'errors', { value: errors })
  }

  static assert(what: boolean | undefined, message: string): asserts what {
    if (! what) throw new ValidationError(message, ValidationError.assert)
  }
}

export class ValidationErrorBuilder {
  readonly errors: ValidationErrors = []
  readonly #options: ValidationOptions

  constructor(options: ValidationOptions) {
    this.#options = options
  }

  record(key: string | number, error: any): void {
    if (error instanceof ValidationError) {
      error.errors.forEach(({ key: subkey, message }) => {
        const newkey =
            typeof key === 'number' ? `[${key}]${subkey}` :
            key ? `${key}.${subkey}` :
            subkey

        this.errors.push({ key: newkey, message })
      })
    } else if (typeof key === 'number') {
      this.errors.push({ key: `[${key}]`, message: error.toString() })
    } else {
      this.errors.push({ key, message: error.toString() })
    }

    if (this.errors.length > this.#options.maximumFailures) {
      throw new ValidationError(this.errors)
    }
  }

  assert(): void {
    if (this.errors.length > 0) throw new ValidationError(this.errors, this.assert)
  }
}