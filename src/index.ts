export type { Validator } from './validation'

export { any, boolean, constant, number, string } from './primitives'
export { array } from './arrays'
export { object } from './objects'
export { additionalProperties, readonly, optional, never } from './schemas'
export { allOf, oneOf } from './unions'

import { getValidator, InferValidationType, Validation } from './validation'

export function validate<V extends Validation>(validator: V, value: any): InferValidationType<V> {
  if (getValidator(validator).validate(value, <any> null)) {
    return value
  } else {
    throw new Error('Invalid')
  }
}
