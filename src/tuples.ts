import { Tuple, InferTuple, Validator, ValidationOptions } from './types'

export class TupleValidator<T extends Tuple> extends Validator<InferTuple<T>> {
  readonly tuple: T

  constructor(tuple: T) {
    super()
    this.tuple = tuple
  }

  validate(value: unknown, options: ValidationOptions): InferTuple<T> {
    void value, options
    throw new Error('Method not implemented.') // TODO
  }
}

export function tuple<T extends Tuple>(tuple: T): Validator<InferTuple<T>> {
  return new TupleValidator(tuple)
}
