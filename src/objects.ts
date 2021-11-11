import type {
  InferSchema,
  ObjectValidator,
  Schema,
  SchemaValidator,
} from './schemas'

/* ========================================================================== *
 * OBJECT VALIDATOR                                                           *
 * ========================================================================== */

export function object(): ObjectValidator // <any, undefined>
export function object<S extends Schema>(schema: S): SchemaValidator<InferSchema<S>, S>
export function object<S extends Schema>(schema?: S): SchemaValidator<InferSchema<S>, S> {
  return {
    schema: <S> schema,
    validate: (value: any): InferSchema<S> => {
      return value
    },
  }
}
