import { generateTypes } from '../src/dts-generator'
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
} from '../src/index'

describe('DTS Generation', () => {
  it('should generate the DTS for some basic types', () => {
    expect(generateTypes({
      test: any,
    })).to.equal('type test = any;')

    expect(generateTypes({
      test: array,
    })).to.equal('type test = any[];')

    expect(generateTypes({
      test: number,
    })).to.equal('type test = number;')

    expect(generateTypes({
      test: object,
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = { [key in string]: any; };')

    expect(generateTypes({
      test: string,
    })).to.equal('type test = string;')

    expect(generateTypes({
      test: boolean,
    })).to.equal('type test = boolean;')

    expect(generateTypes({
      test: date,
    })).to.equal('type test = Date;')
  })

  it('should generate the DTS for arrays', () => {
    expect(generateTypes({
      test: array,
    })).to.equal('type test = any[];')

    expect(generateTypes({
      test: arrayOf(string),
    })).to.equal('type test = string[];')
  })

  it('should generate the DTS for constants', () => {
    expect(generateTypes({
      test: 'a string',
    })).to.equal('type test = "a string";')

    expect(generateTypes({
      test: 12345,
    })).to.equal('type test = 12345;')

    expect(generateTypes({
      test: false,
    })).to.equal('type test = false;')

    expect(generateTypes({
      test: true,
    })).to.equal('type test = true;')

    expect(generateTypes({
      test: null,
    })).to.equal('type test = null;')

    expect(() => generateTypes({
      test: constant(<any> { toString: () => 'foo' }),
    })).to.throw(TypeError, 'Invalid constant "foo"')
  })

  it('should generate the DTS for (branded) numbers', () => {
    expect(generateTypes({
      test: number({}),
    })).to.equal('type test = number;')

    expect(generateTypes({
      test: number({ brand: 'foo' }),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = number & { __brand_foo: never; };')
  })

  it('should generate the DTS for (branded) strings', () => {
    expect(generateTypes({
      test: string({}),
    })).to.equal('type test = string;')

    expect(generateTypes({
      test: string({ brand: 'foo' }),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = string & { __brand_foo: never; };')
  })

  it('should generate the DTS for tuples', () => {
    expect(generateTypes({
      test: [],
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = [ ];')

    expect(generateTypes({
      test: [ number, string, boolean ],
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = [ number, string, boolean ];')

    expect(generateTypes({
      test: [ 12345, 'foo', null ],
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = [ 12345, "foo", null ];')

    expect(generateTypes({
      test: [ number, ...string, boolean ],
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = [ number, ...string[], boolean ];')

    // combine types in unions when multiple rest parameters exist..

    expect(generateTypes({
      test: [ ...number, string, ...boolean ],
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = [ ...(number | string | boolean)[] ];')

    expect(generateTypes({
      test: [ 'foo', ...number, string, ...boolean, 'bar' ],
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = [ "foo", ...(number | string | boolean)[], "bar" ];')
  })

  it('should generate the DTS for unions', () => {
    expect(generateTypes({
      test: allOf(string, number, boolean),
    })).to.equal('type test = string & number & boolean;')

    expect(generateTypes({
      test: oneOf(string, number, boolean),
    })).to.equal('type test = string | number | boolean;')
  })

  it('should generate the DTS for objects', () => {
    expect(generateTypes({
      test: object,
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = { [key in string]: any; };')

    expect(generateTypes({
      test: object(),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = { [key in string]: any; };')

    expect(generateTypes({
      test: object({}),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = {};')

    expect(generateTypes({
      test: object({
        s: string,
        n: number,
        b: boolean,
        x: null,
      }),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = { s: string; n: number; b: boolean; x: null; };')

    expect(generateTypes({
      test: object({
        s: readonly(string),
        n: optional(number),
        ro: readonly(optional('RO')),
        or: optional(readonly('OR')),
        x: never,
      }),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = { readonly s: string; n?: number; readonly ro?: "RO"; readonly or?: "OR"; x?: never; };')

    expect(generateTypes({
      test: object({
        s: string,
        ...allowAdditionalProperties,
      }),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = { s: string; } & { [key in string]: any; };')

    expect(generateTypes({
      test: object({
        s: string,
        ...allowAdditionalProperties(),
      }),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = { s: string; } & { [key in string]: any; };')

    expect(generateTypes({
      test: object({
        s: string,
        ...allowAdditionalProperties(number),
      }),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = { s: string; } & { [key in string]: number; };')

    expect(generateTypes({
      test: object({
        ...allowAdditionalProperties(number),
      }),
    }).replace(/\s+/gm, ' '))
        .to.equal('type test = { [key in string]: number; };')
  })
})
