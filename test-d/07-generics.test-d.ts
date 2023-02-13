import { expectAssignable, expectError, expectType, printType } from 'tsd'
import { arrayOf, InferValidation, object, validate, Validation } from '../src'

printType('__file_marker__')

export class C<V1 extends Validation, V2 extends Validation> {
  validation1: V1
  validation2: V2

  constructor(validation1: V1, validation2: V2) {
    this.validation1 = validation1
    this.validation2 = validation2
  }

  test(value: unknown): void {
    const a1 = validate(arrayOf(this.validation1), [])
    expectType<InferValidation<V1>[]>(a1)
    this.retest(...a1)

    const a2 = validate(arrayOf(this.validation2), [])
    expectError(this.retest(...a2))

    const o1 = validate(object({ test: this.validation1 }), value)
    expectAssignable<{ test: InferValidation<V1> }>(o1)
    this.retest(o1.test)

    const o2 = validate(object({ test: this.validation2 }), value)
    expectError(this.retest(o2.test))
  }

  retest(...value: InferValidation<V1>[]): void {
    void value
  }
}
