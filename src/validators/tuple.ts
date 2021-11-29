import { Tuple, InferTuple, Validator, TupleRestParameter, InferValidation, restValidator } from '../types'
import { ValidationOptions } from '../types'
import { assertValidation, ValidationErrorBuilder, ValidationError } from '../errors'
import { getValidator } from '../utilities'
import { nullValidator } from './constant'

export class TupleValidator<T extends Tuple> extends Validator<InferTuple<T>> {
  readonly tuple: T

  #validators: ({ single: boolean, validator: Validator })[] = []

  constructor(tuple: T) {
    super()

    this.tuple = tuple
    for (const item of tuple) {
      if (item === null) { // god knows why typeof null === "object"
        this.#validators.push({ single: true, validator: nullValidator })
      } else if ((typeof item === 'object') && (restValidator in item)) {
        this.#validators.push({ single: false, validator: (<any>item)[restValidator] })
      } else {
        this.#validators.push({ single: true, validator: getValidator(item) })
      }
    }
  }

  validate(value: unknown, options: ValidationOptions): InferTuple<T> {
    assertValidation(Array.isArray(value), 'Value is not an "array"')

    // Empty tuples
    if (this.#validators.length === 0) {
      const size = value.length
      assertValidation(size === 0, `Found ${size} element${size === 1 ? '' : 's'} validating empty tuple`)
      return value as InferTuple<T>
    }

    // Validate iterating...
    const clone = new Array(value.length)
    let needle = 0
    let haystack = 0
    let { single, validator } = this.#validators[needle]

    while ((needle < this.#validators.length) && (haystack < value.length)) {
      try {
        clone[haystack] = validator.validate(value[haystack], options)
        if (single) ({ single, validator } = this.#validators[++ needle] || {})
        haystack ++
      } catch (error) {
        if (single) new ValidationErrorBuilder().record(error, haystack).assert(null)
        else ({ single, validator } = this.#validators[++ needle] || {})
      }
    }

    while ((needle < this.#validators.length) && (this.#validators[needle].single === false)) {
      needle ++
    }

    const missing = this.#validators.length - needle
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

export function tuple<T extends Tuple>(tuple: T): Validator<InferTuple<T>> {
  return new TupleValidator(tuple)
}

export function makeTupleRestIterable<
  F extends () => Validator,
>(create: F): F & Iterable<TupleRestParameter<InferValidation<F>>> {
  const validator = create()
  ;(<any>create)[Symbol.iterator] = function* (): Generator<TupleRestParameter<InferValidation<F>>> {
    yield { [restValidator]: validator }
  }
  return create as any
}
