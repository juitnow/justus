import { StringValidator } from '../validators/string'

import type { Branding } from '../types'

export const UUID_EXPR = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i


export class UUIDValidator extends StringValidator<string & Branding<'uuid'>> {
  constructor() {
    super({ minLength: 36, maxLength: 36, pattern: UUID_EXPR })
  }

  validate(value: unknown): string & Branding<'uuid'>
  validate(value: unknown): string {
    return super.validate(value).toLowerCase()
  }
}

export const uuid = new UUIDValidator()
