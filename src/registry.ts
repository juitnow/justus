import { assertSchema } from './errors'

import type { ConstantValidator } from './validators/constant'
import type { ObjectValidator } from './validators/object'
import type { TupleValidator } from './validators/tuple'

type RegistryTypes = {
  constant: typeof ConstantValidator,
  object: typeof ObjectValidator,
  tuple: typeof TupleValidator,
}

const _registry: Partial<RegistryTypes> = {}

/** Internal registry for validator constructors (avoids circular imports) */
export const registry = {
  /** Registers the specified validator constructor */
  set<K extends keyof RegistryTypes>(key: K, constructor: RegistryTypes[K]): void {
    _registry[key] = constructor
  },

  /** Retrieves the specified validator constructor */
  get<K extends keyof RegistryTypes>(key: K): RegistryTypes[K] {
    const value = _registry[key]
    assertSchema(!! value, `No validator found for "${key}"`)
    return value
  },
}
