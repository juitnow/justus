import { StringValidator } from '../validators/string'

export const EMAIL_EXPR = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})$/

export type EmailString = string & { __email: never }

export class EmailValidator extends StringValidator<EmailString, string> {
  constructor() {
    super({ minLength: 5, maxLength: 128, pattern: EMAIL_EXPR })
  }

  validate(value: unknown): EmailString
  validate(value: unknown): string {
    return super.validate(value).toLowerCase()
  }
}

export const email = new EmailValidator()
