import { assertValidation, ValidationError } from '../errors'
import { AbstractValidator, restValidator } from '../types'
// eslint-disable-next-line import/no-cycle
import { getValidator } from '../utilities'
import { nullValidator } from './constant'

import type { InferTuple, Tuple, ValidationOptions, Validator } from '../types'

export interface TupleMember { single: boolean, validator: Validator }

/** A `Validator` for _tuples_. */
export class TupleValidator<T extends Tuple> extends AbstractValidator<InferTuple<T>> {
  readonly members: readonly TupleMember[]
  readonly tuple: T

  constructor(tuple: T) {
    super()

    const members: TupleMember[] = []
    for (const item of tuple) {
      if (item === null) { // god knows why typeof null === "object"
        members.push({ single: true, validator: nullValidator })
      } else if ((typeof item === 'object') && (restValidator in item)) {
        members.push({ single: false, validator: (<any>item)[restValidator] })
      } else {
        members.push({ single: true, validator: getValidator(item) })
      }
    }

    this.members = members
    this.tuple = tuple
  }

  validate(value: unknown, options: ValidationOptions): InferTuple<T> {
    assertValidation(Array.isArray(value), 'Value is not an "array"')

    // Empty tuples
    if (this.members.length === 0) {
      const size = value.length
      assertValidation(size === 0, `Found ${size} element${size === 1 ? '' : 's'} validating empty tuple`)
      return value as InferTuple<T>
    }

    // Validate iterating...
    const clone = new Array(value.length)
    let needle = 0
    let haystack = 0
    let { single, validator } = this.members[needle]

    while ((needle < this.members.length) && (haystack < value.length)) {
      try {
        clone[haystack] = validator.validate(value[haystack], options)
        if (single) ({ single, validator } = this.members[++ needle] || {})
        haystack ++
      } catch (error) {
        if (single) throw new ValidationError(error, [ haystack ])
        else ({ single, validator } = this.members[++ needle] || {})
      }
    }

    while ((needle < this.members.length) && (this.members[needle].single === false)) {
      needle ++
    }

    const missing = this.members.length - needle
    if ((missing === 1) && single) {
      throw new ValidationError('Tuple defines 1 missing validation')
    } else if (missing > 1) {
      throw new ValidationError(`Tuple defines ${missing} missing validations`)
    }

    const extra = value.length - haystack
    assertValidation(extra === 0, `Found ${extra} extra element${extra === 1 ? '' : 's'} in tuple`)

    return clone as InferTuple<T>
  }
}

/** Validate _tuples_. */
export function tuple<T extends Tuple>(tuple: T): Validator<InferTuple<T>> {
  return new TupleValidator(tuple)
}
