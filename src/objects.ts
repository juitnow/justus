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
export function object(schema?: Schema): SchemaValidator<any, Schema> {
  // TODO: implement me
  void schema
  return <any> null
}
