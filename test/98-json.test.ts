import { generateJSON } from '../src/json-generator'
import { expect } from 'chai'
import {
  allOf,
  allowAdditionalProperties,
  any,
  array,
  arrayOf,
  boolean,
  constant,
  date,
  never,
  number,
  object,
  oneOf,
  optional,
  readonly,
  string,
  Validation,
} from '../src/index'

describe('DTS Generation', () => {
  it('should generate the DTS for some basic types', () => {
    expect(generateJSON(any)).to.eql({})
    expect(generateJSON(array)).to.eql({ type: 'array' })
    expect(generateJSON(number)).to.eql({ type: 'number' })
    expect(generateJSON(object)).to.eql({ type: 'object' })
    expect(generateJSON(string)).to.eql({ type: 'string' })
    expect(generateJSON(boolean)).to.eql({ type: 'boolean' })
  })

  it('should generate the DTS for arrays', () => {
    expect(generateJSON(arrayOf(string))).to.eql({
      type: 'array',
      items: { type: 'string' },
    })
    expect(generateJSON(array({
      minItems: 100,
      maxItems: 200,
      uniqueItems: true,
      items: number,
    }))).to.eql({
      type: 'array',
      items: { type: 'number' },
      minItems: 100,
      maxItems: 200,
      uniqueItems: true,
    })
  })

  it('should generate the DTS for constants', () => {
    expect(generateJSON({
      test: 'a string',
    })).to.eql('export type test = "a string";')

    expect(generateJSON({
      test: 12345,
    })).to.eql('export type test = 12345;')

    expect(generateJSON({
      test: false,
    })).to.eql('export type test = false;')

    expect(generateJSON({
      test: true,
    })).to.eql('export type test = true;')

    expect(generateJSON({
      test: null,
    })).to.eql('export type test = null;')

    expect(() => generateJSON({
      test: constant(<any> { toString: () => 'foo' }),
    })).to.throw(TypeError, 'Invalid constant "foo"')
  })

  it('should generate the DTS for (branded) numbers', () => {
    expect(generateJSON({
      test: number({}),
    })).to.eql('export type test = number;')

    expect(generateJSON({
      test: number({ brand: 'foo' }),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = number & { __brand_foo: never; };')
  })

  it('should generate the DTS for (branded) strings', () => {
    expect(generateJSON({
      test: string({}),
    })).to.eql('export type test = string;')

    expect(generateJSON({
      test: string({ brand: 'foo' }),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = string & { __brand_foo: never; };')
  })

  it('should generate the DTS for tuples', () => {
    expect(generateJSON({
      test: [],
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = [ ];')

    expect(generateJSON({
      test: [ number, string, boolean ],
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = [ number, string, boolean ];')

    expect(generateJSON({
      test: [ 12345, 'foo', null ],
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = [ 12345, "foo", null ];')

    expect(generateJSON({
      test: [ number, ...string, boolean ],
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = [ number, ...string[], boolean ];')

    // combine types in unions when multiple rest parameters exist..

    expect(generateJSON({
      test: [ ...number, string, ...boolean ],
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = [ ...(number | string | boolean)[] ];')

    expect(generateJSON({
      test: [ 'foo', ...number, string, ...boolean, 'bar' ],
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = [ "foo", ...(number | string | boolean)[], "bar" ];')
  })

  it('should generate the DTS for unions', () => {
    expect(generateJSON({
      test: allOf(string, number, boolean),
    })).to.eql('export type test = string & number & boolean;')

    expect(generateJSON({
      test: oneOf(string, number, boolean),
    })).to.eql('export type test = string | number | boolean;')
  })

  it('should generate the DTS for objects', () => {
    expect(generateJSON({
      test: object,
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = { [key in string]: any; };')

    expect(generateJSON({
      test: object(),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = { [key in string]: any; };')

    expect(generateJSON({
      test: object({}),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = {};')

    expect(generateJSON({
      test: object({
        s: string,
        n: number,
        b: boolean,
        x: null,
      }),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = { s: string; n: number; b: boolean; x: null; };')

    expect(generateJSON({
      test: object({
        s: readonly(string),
        n: optional(number),
        ro: readonly(optional('RO')),
        or: optional(readonly('OR')),
        x: never,
      }),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = { readonly s: string; n?: number; readonly ro?: "RO"; readonly or?: "OR"; x?: never; };')

    expect(generateJSON({
      test: object({
        s: string,
        ...allowAdditionalProperties,
      }),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = { s: string; } & { [key in string]: any; };')

    expect(generateJSON({
      test: object({
        s: string,
        ...allowAdditionalProperties(),
      }),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = { s: string; } & { [key in string]: any; };')

    expect(generateJSON({
      test: object({
        s: string,
        ...allowAdditionalProperties(number),
      }),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = { s: string; } & { [key in string]: number; };')

    expect(generateJSON({
      test: object({
        ...allowAdditionalProperties(number),
      }),
    }).replace(/\s+/gm, ' '))
        .to.eql('export type test = { [key in string]: number; };')
  })

  it('should reference exported validators', () => {
    // this will be exported...
    const uuid = string({ brand: 'uuid ' })
    // this will be embedded in product below
    const price = number({ brand: 'price' })
    // object mapping two validators above
    const product = object({ uuid, price })
    // this is an export aliasing "uuid" as "test"
    const test = uuid

    // what we expect to see...
    const expected = `
      export type uuid = string & {
        __brand_uuid : never;
      };
      export type product = {
        uuid: uuid;
        price: number & {
          __brand_price: never;
        };
      };
      export type test = uuid;`
        .replace(/\s+/gm, ' ').trim()

    // run our little test...
    expect(generateJSON({ uuid, product, test })
        .replace(/\s+/gm, ' ').trim())
        .to.eql(expected)
  })
})
