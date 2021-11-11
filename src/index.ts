export type { Validator } from './basics'

export { any, boolean, constant, number, string } from './primitives'
export { array } from './arrays'
export { object } from './objects'
export { additionalProperties, readonly, optional } from './schemas'
export { allOf, oneOf } from './unions'

import { getValidator, InferValidationType, Validation } from './basics'

export function validate<V extends Validation>(validator: V, value: any): InferValidationType<V> {
  return getValidator(validator).validate(value)
}
