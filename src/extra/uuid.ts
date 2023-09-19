import { StringValidator } from '../validators/string'

export const UUID_EXPR = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type UUIDString = string & { __uuid: never }

export class UUIDValidator extends StringValidator<UUIDString, string> {
  constructor() {
    super({ minLength: 36, maxLength: 36, pattern: UUID_EXPR })
  }

  validate(value: unknown): UUIDString
  validate(value: unknown): string {
    return super.validate(value).toLowerCase()
  }
}

export const uuid = new UUIDValidator()
