import { assertValidation } from '../errors'
import { AbstractValidator, makeValidatorFactory } from '../types'

/*  ===== TYPES ============================================================= */

/** The type for a validated _string_ ARN (Amazon Resource Name) */
export type ArnString<
  Service extends string = string,
  ResourceType extends string = string,
> = string & { __arn: never }
& ( string extends Service ? string : { [ k in `__arn_service_${Service}`] : never })
& ( string extends ResourceType ? string : { [ k in `__arn_resource_${ResourceType}`] : never })

/** The type for a _parsed_ ARN (Amazon Resource Name) */
export interface ParsedArn<
  Service extends string = string,
  ResourceType extends string = string,
> {
  /** The full  */
  Arn: ArnString<Service, ResourceType>,
  Partition: string,
  Service: Service,
  Region: string,
  Account: string,
  Resource: [ ResourceType, ...string[] ],
}

/* ===== INTERNALS ========================================================== */

function assertComponent<T extends string>(
    actual: string,
    expected: T | undefined,
    kind: string,
): asserts actual is T {
  if (expected === undefined) return
  assertValidation(actual === expected, `ARN ${kind} "${actual}" mismatch (expected "${expected}")`)
}

/** Validate a string and convert it into into an {@link ParsedArn} */
function parse<Service extends string, ResourceType extends string>(
    value: unknown,
    service?: Service,
    type?: ResourceType,
): ParsedArn<Service, ResourceType> {
  assertValidation(typeof value === 'string', 'Value is not a "string"')

  const segments = value.split(':')

  assertValidation(segments.length >= 6, 'Invalid components in ARN')

  const [ pfx, prt, svc, rgn, act, ...res ] = segments

  assertValidation(pfx === 'arn', 'ARN must start with "arn:"')
  assertValidation(!! prt, 'Missing partition in ARN')
  assertValidation(!! svc, 'Missing service in ARN')
  assertValidation(!! act, 'Missing account ID in ARN')
  assertValidation(!! res[0], 'Missing resource ID in ARN')

  const [ [ resType, ...resArray ], resString ] = res[0].includes('/') ?
    [ res[0].split('/'), res[0] ] :
    [ res, res.join(':') ]

  assertValidation(!! resType, 'Invalid resource ID in ARN')

  assertComponent(svc, service, 'Service')
  assertComponent(resType, type, 'Resource Type')

  const arn = `arn:${prt}:${svc}:${rgn}:${act}:${resString}`

  return {
    Arn: arn as ArnString<Service, ResourceType>,
    Partition: prt,
    Service: svc, // as Service,
    Region: rgn || '',
    Account: act,
    Resource: [ resType, ...resArray ], // as [ ResourceType, ...string[] ],
  }
}

/* ===== VALIDATOR CLASSES ================================================== */

/** Validator parsing an ARN (Amazon Resource Name) and returning its components */
export class ParsedArnValidator<
  Service extends string = string,
  ResourceType extends string = string,
> extends AbstractValidator<ParsedArn<Service, ResourceType>, string> {
  /**
   * Create a new {@link ParsedArnValidator} instance.
   *
   * @param service The (optional) service the ARN should be pointing to
   *                (e.g. `iam` or `elasticloadbalancing`)
   * @param resourceType The (optional) resource _type_ the ARN should be
   *                     representing (e.g. `role` in the `iam` service, or
   *                     `targetgroup` in the `elasticloadbalancing` service)
   */
  constructor(service?: Service, resourceType?: ResourceType)
  constructor(private _service?: Service, private _type?: ResourceType) {
    super()
  }

  validate(value: unknown): ParsedArn<Service, ResourceType> {
    return parse(value, this._service, this._type)
  }
}

/** Validator validating an ARN (Amazon Resource Name) _string_ */
export class ArnValidator<
  Service extends string = string,
  ResourceType extends string = string,
> extends AbstractValidator<ArnString<Service, ResourceType>, string> {
  /**
   * Create a new {@link ArnValidator} instance.
   *
   * @param service The (optional) service the ARN should be pointing to
   *                (e.g. `iam` or `elasticloadbalancing`)
   * @param resourceType The (optional) resource _type_ the ARN should be
   *                     representing (e.g. `role` in the `iam` service, or
   *                     `targetgroup` in the `elasticloadbalancing` service)
   */
  constructor(service?: Service, resourceType?: ResourceType)
  constructor(private _service?: Service, private _type?: ResourceType) {
    super()
  }

  validate(value: unknown): ArnString<Service, ResourceType> {
    return parse(value, this._service, this._type).Arn
  }
}

/* ===== VALIDATOR FACTORIES ================================================ */

/**
 * Create a new {@link ParsedArnValidator} parsing an ARN referring to the
 * specified `service` (e.g. `iam` or `elasticloadbalancing`).
 *
 * An (optional) resource _type_ can be specified, and will validate the first
 * component of the ARN's resource (e.g. `role` in the `iam` service, or
 * `targetgroup` in the `elasticloadbalancing` service)
 */
export function parseArnFactory<
  Service extends string = string,
  ResourceType extends string = string>(
    service: Service,
    resourceType?: ResourceType,
): ParsedArnValidator<Service, ResourceType> {
  return new ParsedArnValidator(service, resourceType)
}

/**
 * Create a new {@link ArnValidator} validating an ARN referring to the
 * specified `service` (e.g. `iam` or `elasticloadbalancing`).
 *
 * An (optional) resource _type_ can be specified, and will validate the first
 * component of the ARN's resource (e.g. `role` in the `iam` service, or
 * `targetgroup` in the `elasticloadbalancing` service)
 */
export function arnFactory<
  Service extends string = string,
  ResourceType extends string = string>(
    service: Service,
    resourceType?: ResourceType,
): ArnValidator<Service, ResourceType> {
  return new ArnValidator(service, resourceType)
}

/* ===== VALIDATOR CONSTANTS ================================================ */

/** Validate a string and parse it into into an {@link ParsedArn} */
export const parseArn = makeValidatorFactory(new ParsedArnValidator(), parseArnFactory)

/** Validate a ARN (Amazon Resource Name) string */
export const arn = makeValidatorFactory(new ArnValidator(), arnFactory)
