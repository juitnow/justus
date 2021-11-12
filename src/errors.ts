type ValidationErrors = { key: string | number, message: string }[]

export class ValidationError extends Error {
  readonly errors: ValidationErrors

  constructor(errors: any[]) {
    super(`Found ${errors.length} validation errors`)
    this.errors = errors
    Error.captureStackTrace(this, ValidationError)
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
    } else {
      this.errors.push({ key, message: error.toString() })
    }
  }

  assert(): void {
    if (this.errors.length > 0) throw new ValidationError(this.errors)
  }
}
