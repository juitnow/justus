import {
  any,
  array,
  boolean,
  date,
  never,
  number,
  object,
  string,
  url,
} from 'justus'

export const testValidator = object({
  _any: any,
  _array: array,
  _boolean: boolean,
  _date: date,
  _never: never,
  _number: number,
  _object: object,
  _string: string,
  _url: url,
})
