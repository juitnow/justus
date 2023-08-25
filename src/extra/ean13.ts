import { assertValidation } from '../errors'
import { StringValidator } from '../validators/string'

import type { Branding } from '../types'

export class EAN13Validator extends StringValidator<string & Branding<'ean_13'>, string | number> {
  constructor() {
    super({ minLength: 13, maxLength: 13, pattern: /^\d{13}$/ })
  }

  validate(value: unknown): string & Branding<'ean_13'>
  validate(value: unknown): string {
    if (typeof value === 'number') value = `${value}`
    const ean13 = super.validate(value).toLowerCase()

    /* Calculate the weighted sum for the first 12 digits */
    let sum = 0
    for (let i = 0, w = 1; i < 12; i ++, w = i % 2 ? 3 : 1) {
      sum += (ean13.charCodeAt(i) - 0x30) * w
    }

    /* 10 - sum should match our 13th digit */
    const valid = (10 - (sum % 10)) % 10 === ean13.charCodeAt(12) - 0x30

    /* Assert validity of the checksum and return */
    assertValidation(valid, `Invalid checksum in EAN-13 "${ean13}"`)
    return ean13
  }
}

export const ean13 = new EAN13Validator()
