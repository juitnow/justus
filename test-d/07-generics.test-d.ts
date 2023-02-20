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
    const v1 = validate(this.validation1, value)
    expectType<InferValidation<V1>>(v1)

    const v2 = validate(this.validation2, value)
    expectType<InferValidation<V2>>(v2)

    const a1 = validate(arrayOf(this.validation1), [])
    expectType<InferValidation<V1>[]>(a1)

    const a2 = validate(arrayOf(this.validation2), [])
    expectType<InferValidation<V2>[]>(a2)

    // objects with generics are tricky: we don't know whether the validated
    // type inferred by the generic "validation" type in this class can extend
    // "undefined" or not, so the key associated with the generic will _always_
    // be marked as optional by our "InferSchema" type, and therefore the type
    // will always be "InferValidation<...> | undefined"

    const o1 = validate(object({ test: this.validation1 }), value)
    expectAssignable<{ test?: InferValidation<V1> | undefined }>(o1)
    expectType<InferValidation<V1 | undefined>>(o1.test)
    expectError(o1.nope) // just make sure we don't extend "any"

    const o2 = validate(object({ test: this.validation2 }), value)
    expectAssignable<{ test?: InferValidation<V2> | undefined }>(o2)
    expectType<InferValidation<V2> | undefined>(o2.test)
    expectError(o2.nope) // just make sure we don't extend "any"
  }
}
