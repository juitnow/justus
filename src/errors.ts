import { assert } from './utilities'

type ValidationErrors = { key: string, message: string }[]

export class ValidationError extends Error {
  readonly errors: ValidationErrors

  constructor(errors: ValidationErrors) {
    assert(errors.length > 0, 'Attempting to build a "ValidationError" with no errors')

    super(`Found ${errors.length} validation errors`)
    this.errors = errors

    const details = errors
        .map(({ key, message }) => `${key} : ${message}`)
        .join('\n  ')

    Error.captureStackTrace(this, ValidationError)
    this.stack = this.stack!.replace('\n', `\n  ${details}\n`)
  }
}

export class ValidationErrorBuilder {
  readonly errors: ValidationErrors = []

  record(key: string | number, error: any): void {
    if (error instanceof ValidationError) {
      error.errors.forEach(({ key: subkey, message }) => {
        const newkey =
            typeof subkey == 'number' ? `${key}[${subkey}]` :
            key ? `${key}.${subkey}` :
            subkey

        this.errors.push({ key: newkey, message })
      })
    } else if (typeof key === 'number') {
      this.errors.push({ key: `[${key}]`, message: error.toString() })
    } else {
      this.errors.push({ key, message: error.toString() })
    }
  }

  assert(): void {
    if (this.errors.length > 0) throw new ValidationError(this.errors)
  }
}
