import type { Validator } from './basics'

export function isPrimitive(what: any): what is boolean | string | number | null {
  if (what === null) return true
  switch (typeof what) {
    case 'boolean':
    case 'string':
    case 'number':
      return true
    default:
      return false
  }
}

export function isFunction(what: any): what is Function {
  return typeof what === 'function'
}

export function isValidator(what: any): what is Validator {
  return what &&
    (typeof what === 'object') &&
    ('validate' in what) &&
    (typeof what.validate === 'function')
}
