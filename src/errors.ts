type ValidationErrors = { path: (string | number)[], message: string }[]

function pathToString(path: (string | number)[]): string {
  return path.reduce((string: string, key, index): string => {
    if (typeof key === 'number') return `${string}[${key}]`
    return index === 0 ? key : `${string}.${key}`
  }, '')
}

/** Simple assertion function */
export function assert(what: boolean | undefined, message: string): asserts what {
  if (! what) throw new TypeError(message)
}

export class ValidationError extends Error {
  readonly errors!: ValidationErrors

  constructor(message: string, constructor?: Function)
  constructor(errors: ValidationErrors, constructor?: Function)
  constructor(errors: ValidationErrors | string, constructor?: Function) {
    if (typeof errors === 'string') errors = [ { path: [], message: errors } ]

    const details = errors
        .map(({ path, message }) => ({ key: pathToString(path), message }))
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

  record(key: string | number, error: any): void {
    if (error instanceof ValidationError) {
      error.errors.forEach(({ path, message }) => {
        this.errors.push({ path: [ key, ...path ], message })
      })
    } else {
      this.errors.push({ path: [ key ], message: `${error}` })
    }
  }

  assert(): void {
    if (this.errors.length > 0) throw new ValidationError(this.errors, this.assert)
  }
}
