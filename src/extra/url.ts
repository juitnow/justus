import { ValidationError, ValidationErrorBuilder } from '../errors'
import { AbstractValidator, makeValidatorFactory } from '../types'
import { ConstantValidator } from '../validators/constant'
import { ObjectValidator } from '../validators/object'

import type { ValidationOptions } from '..'
import type { Schema, Validator } from '../types'

const KEYS: Exclude<keyof URLConstraints, 'searchParams'>[] = [
  'href',
  'origin',
  'protocol',
  'username',
  'password',
  'host',
  'hostname',
  'port',
  'pathname',
  'search',
  'hash',
]

const OPTIONS: ValidationOptions = {
  stripAdditionalProperties: false,
  stripForbiddenProperties: false,
  stripOptionalNulls: false,
}

/** Constraints to validate a `URL` with. */
export interface URLConstraints {
  /** Constraint to validate the `href` component of the `URL`. */
  href?: string | Validator<string>,
  /** Constraint to validate the `origin` component of the `URL`. */
  origin?: string | Validator<string>,
  /** Constraint to validate the `protocol` component of the `URL`. */
  protocol?: string | Validator<string>,
  /** Constraint to validate the `username` component of the `URL`. */
  username?: string | Validator<string>,
  /** Constraint to validate the `password` component of the `URL`. */
  password?: string | Validator<string>,
  /** Constraint to validate the `host` (`hostname:port`) component of the `URL`. */
  host?: string | Validator<string>,
  /** Constraint to validate the `hostname` component of the `URL`. */
  hostname?: string | Validator<string>,
  /** Constraint to validate the `port` component of the `URL`. */
  port?: string | Validator<string>,
  /** Constraint to validate the `pathname` component of the `URL`. */
  pathname?: string | Validator<string>,
  /** Constraint to validate the `search` component of the `URL` as a string. */
  search?: string | Validator<string>,
  /** Constraint to validate the `hash` component of the `URL`. */
  hash?: string | Validator<string>,
  /**
   * Schema used to validate the `searchParams` component of the `URL`.
   *
   * The `searchParams` will be normalized in a `Record<string, string>`, where
   * only the _first_ value associated with a search parameter will be checked.
   */
  searchParams?: Schema,
}

/** A `Validator` validating URLs and converting them to `URL` instances. */
export class URLValidator extends AbstractValidator<URL, URL | string> {
  readonly href?: Validator<string>
  readonly origin?: Validator<string>
  readonly protocol?: Validator<string>
  readonly username?: Validator<string>
  readonly password?: Validator<string>
  readonly host?: Validator<string>
  readonly hostname?: Validator<string>
  readonly port?: Validator<string>
  readonly pathname?: Validator<string>
  readonly search?: Validator<string>
  readonly hash?: Validator<string>

  readonly searchParams?: ObjectValidator<Schema>

  constructor(constraints: URLConstraints = {}) {
    super()

    for (const key of KEYS) {
      const constraint = constraints[key]
      if (typeof constraint === 'string') {
        this[key] = new ConstantValidator(constraint)
      } else if (constraint) {
        this[key] = constraint
      }
    }

    if (constraints.searchParams) {
      this.searchParams = new ObjectValidator(constraints.searchParams)
    }
  }

  validate(value: unknown): URL {
    let url: URL
    try {
      url = value instanceof URL ? value : new URL(value as any)
    } catch {
      throw new ValidationError('Value could not be converted to a "URL"')
    }

    const builder = new ValidationErrorBuilder()

    for (const key of KEYS) {
      const validator = this[key]
      if (validator) {
        try {
          validator.validate(url[key], OPTIONS)
        } catch (error) {
          builder.record(error, key)
        }
      }
    }

    if (this.searchParams) {
      const parameters: Record<string, string> = {}
      url.searchParams.forEach((value, key) => parameters[key] = value)

      try {
        this.searchParams.validate(parameters, OPTIONS)
      } catch (error) {
        builder.record(error, 'searchParams')
      }
    }

    return builder.assert(url)
  }
}

export function urlFactory(constraints: URLConstraints): URLValidator {
  return new URLValidator(constraints)
}

/** Validate URLs and convert them to `URL` instances. */
export const url = makeValidatorFactory(new URLValidator(), urlFactory)
