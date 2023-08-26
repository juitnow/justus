import { assertValidation } from '../errors'
import { AbstractValidator, makeValidatorFactory } from '../types'

/** The type for a validated _string_ ARN (Amazon Resource Name) */
export type ArnString<Service extends string = string> = string & { __arn: never }
& ( string extends Service ? string : { [ k in `__arn_${Service}`] : never })

/** The type for a _parsed_ ARN (Amazon Resource Name) */
export interface ParsedArn<Service extends string = string> {
  /** The full  */
  Arn: ArnString<Service>,
  Partition: string,
  Service: Service,
  Region: string,
  Account: string,
  Resource: [ string, ...string[] ],
}

/* ========================================================================== */

/** Validate a string and convert it into into an {@link ParsedArn} */
function parse<Service extends string>(value: unknown, service?: Service): ParsedArn<Service> {
  assertValidation(typeof value == 'string', 'Value is not a "string"')

  const segments = value.split(':')

  assertValidation(segments.length >= 6, 'Invalid components in ARN')

  const [ pfx, prt, svc, rgn, act, ...res ] = segments

  assertValidation(pfx === 'arn', 'ARN must start with "arn:"')
  assertValidation(!! prt, 'Missing partition in ARN')
  assertValidation(!! svc, 'Missing service in ARN')
  assertValidation(!! act, 'Missing account ID in ARN')
  assertValidation(!! res[0], 'Missing resource ID in ARN')

  if (service !== undefined) {
    assertValidation(svc === service, `ARN Service "${svc}" mismatch (expected "${service}")`)
  }

  const [ resArray, resString ] = res[0].includes('/') ?
    [ res[0].split('/'), res[0] ] :
    [ res, res.join(':') ]

  assertValidation(!! resArray[0], 'Invalid resource ID in ARN')

  const arn = `arn:${prt}:${svc}:${rgn}:${act}:${resString}`

  return {
    Arn: arn as ArnString<Service>,
    Partition: prt,
    Service: svc as Service,
    Region: rgn || '',
    Account: act,
    Resource: resArray as [ string, ...string[] ],
  }
}

/* ========================================================================== */

/** Validator parsing an ARN (Amazon Resource Name) and returning its components */
export class ParsedArnValidator<Service extends string = string>
  extends AbstractValidator<ParsedArn<Service>, string> {
  constructor(service?: Service)
  constructor(private _service?: Service) {
    super()
  }

  validate(value: unknown): ParsedArn<Service> {
    return parse(value, this._service)
  }
}

/** Validator validating an ARN (Amazon Resource Name) _string_ */
export class ArnValidator<Service extends string = string>
  extends AbstractValidator<ArnString<Service>, string> {
  constructor(service?: Service)
  constructor(private _service?: Service) {
    super()
  }

  validate(value: unknown): ArnString<Service> {
    return parse(value, this._service).Arn
  }
}

/* ========================================================================== */

export function parseArnFactory(): ParsedArnValidator<string>
export function parseArnFactory<Service extends string = string>(service: Service): ParsedArnValidator<Service>
export function parseArnFactory(service?: string): ParsedArnValidator<string> {
  return new ParsedArnValidator(service)
}

export function arnFactory(): ArnValidator<string>
export function arnFactory<Service extends string = string>(service: Service): ArnValidator<Service>
export function arnFactory(service?: string): ArnValidator<string> {
  return new ArnValidator(service)
}

/** Validate a string and parse it into into an {@link ParsedArn} */
export const parseArn = makeValidatorFactory(new ParsedArnValidator(), parseArnFactory)

/** Validate a ARN (Amazon Resource Name) string */
export const arn = makeValidatorFactory(new ArnValidator(), arnFactory)
