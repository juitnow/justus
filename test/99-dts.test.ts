import {
  allOf,
  allowAdditionalProperties,
  any,
  AnyArrayValidator,
  AnyBigIntValidator,
  AnyNumberValidator,
  AnyObjectValidator,
  AnyStringValidator,
  AnyValidator,
  array,
  arrayOf,
  bigint,
  BigIntValidator,
  boolean,
  BooleanValidator,
  constant,
  date,
  DateValidator,
  never,
  NeverValidator,
  number,
  object,
  oneOf,
  optional,
  string,
  tuple,
} from '../src'
import { generateDeclarations, generateTypes } from '../src/dts-generator'
import { ean13, EAN13Validator } from '../src/extra/ean13'
import { url, URLValidator } from '../src/extra/url'
import { uuid, UUIDValidator } from '../src/extra/uuid'

describe('DTS Generation', () => {
  describe('Validated types', () => {
    it('should generate the validated type for some basic types', () => {
      expect(generateTypes({
        test: any,
      })).toStrictlyEqual('export type test = any;')

      expect(generateTypes({
        test: array,
      })).toStrictlyEqual('export type test = any[];')

      expect(generateTypes({
        test: number,
      })).toStrictlyEqual('export type test = number;')

      expect(generateTypes({
        test: object,
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { [key in string]: any; };')

      expect(generateTypes({
        test: string,
      })).toStrictlyEqual('export type test = string;')

      expect(generateTypes({
        test: boolean,
      })).toStrictlyEqual('export type test = boolean;')

      expect(generateTypes({
        test: bigint,
      })).toStrictlyEqual('export type test = bigint;')

      expect(generateTypes({
        test: date,
      })).toStrictlyEqual('export type test = Date;')

      expect(generateTypes({
        test: never,
      })).toStrictlyEqual('export type test = undefined;')
    })

    it('should generate the validated type for some basic validators', () => {
      expect(generateTypes({
        test: new AnyValidator(),
      })).toStrictlyEqual('export type test = any;')

      expect(generateTypes({
        test: new AnyArrayValidator(),
      })).toStrictlyEqual('export type test = any[];')

      expect(generateTypes({
        test: new AnyBigIntValidator(),
      })).toStrictlyEqual('export type test = bigint;')

      expect(generateTypes({
        test: new AnyNumberValidator(),
      })).toStrictlyEqual('export type test = number;')

      expect(generateTypes({
        test: new AnyObjectValidator(),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { [key in string]: any; };')

      expect(generateTypes({
        test: new AnyStringValidator(),
      })).toStrictlyEqual('export type test = string;')

      expect(generateTypes({
        test: new BooleanValidator(),
      })).toStrictlyEqual('export type test = boolean;')

      expect(generateTypes({
        test: new BigIntValidator(),
      })).toStrictlyEqual('export type test = bigint;')

      expect(generateTypes({
        test: new DateValidator(),
      })).toStrictlyEqual('export type test = Date;')

      expect(generateTypes({
        test: new NeverValidator(),
      })).toStrictlyEqual('export type test = undefined;')
    })

    it('should generate the validated type for arrays', () => {
      expect(generateTypes({
        test: array,
      })).toStrictlyEqual('export type test = any[];')

      expect(generateTypes({
        test: arrayOf(string),
      })).toStrictlyEqual('export type test = string[];')

      expect(generateTypes({
        test: arrayOf(url),
      })).toStrictlyEqual('export type test = URL[];')
    })

    it('should generate the validated type for constants', () => {
      expect(generateTypes({
        test: 'a string',
      })).toStrictlyEqual('export type test = "a string";')

      expect(generateTypes({
        test: 12345,
      })).toStrictlyEqual('export type test = 12345;')

      expect(generateTypes({
        test: 1234n,
      })).toStrictlyEqual('export type test = 1234n;')

      expect(generateTypes({
        test: false,
      })).toStrictlyEqual('export type test = false;')

      expect(generateTypes({
        test: true,
      })).toStrictlyEqual('export type test = true;')

      expect(generateTypes({
        test: null,
      })).toStrictlyEqual('export type test = null;')

      expect(() => generateTypes({
        test: constant(<any> { toString: () => 'foo' }),
      })).toThrowError(TypeError, 'Invalid constant "foo"')
    })

    it('should generate the validated type for (branded) bigints', () => {
      expect(generateTypes({
        test: bigint({}),
      })).toStrictlyEqual('export type test = bigint;')

      expect(generateTypes({
        test: bigint({ brand: 'foo' }),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = bigint & { __brand_foo: never; };')
    })

    it('should generate the validated type for (branded) numbers', () => {
      expect(generateTypes({
        test: number({}),
      })).toStrictlyEqual('export type test = number;')

      expect(generateTypes({
        test: number({ brand: 'foo' }),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = number & { __brand_foo: never; };')
    })

    it('should generate the validated type for (branded) strings', () => {
      expect(generateTypes({
        test: string({}),
      })).toStrictlyEqual('export type test = string;')

      expect(generateTypes({
        test: string({ brand: 'foo' }),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = string & { __brand_foo: never; };')
    })

    it('should generate the validated type for tuples', () => {
      expect(generateTypes({
        test: [],
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = [ ];')

      expect(generateTypes({
        test: [ number, string, boolean ],
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = [ number, string, boolean ];')

      expect(generateTypes({
        test: [ 12345, 'foo', null ],
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = [ 12345, "foo", null ];')

      expect(generateTypes({
        test: [ number, ...string, boolean ],
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = [ number, ...string[], boolean ];')

      // combine types in unions when multiple rest parameters exist..

      expect(generateTypes({
        test: [ ...number, string, ...boolean ],
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = [ ...(number | string | boolean)[] ];')

      expect(generateTypes({
        test: [ 'foo', ...number, string, ...boolean, 'bar' ],
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = [ "foo", ...(number | string | boolean)[], "bar" ];')
    })

    it('should generate the validated type for unions', () => {
      expect(generateTypes({
        test: allOf(string, number, boolean),
      })).toStrictlyEqual('export type test = string & number & boolean;')

      expect(generateTypes({
        test: oneOf(string, number, boolean),
      })).toStrictlyEqual('export type test = string | number | boolean;')
    })

    it('should generate the validated type for optionals', () => {
      expect(generateTypes({
        hasDefault: optional(string, 'foobar'),
        noDefault: optional(number),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type hasDefault = string; export type noDefault = number | undefined;')

      expect(generateTypes({
        test: {
          hasDefault: optional(oneOf('foo', 'bar'), 'foo'),
          noDefault: optional(oneOf('foo', 'bar')),
        },
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { hasDefault: "foo" | "bar"; noDefault?: "foo" | "bar" | undefined; };')
    })

    it('should generate the validated type for optionals in input mode', () => {
      expect(generateTypes({
        hasDefault: optional(string, 'foobar'),
        noDefault: optional(number),
      }, true).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type hasDefault = string | undefined; export type noDefault = number | undefined;')

      expect(generateTypes({
        test: {
          hasDefault: optional(oneOf('foo', 'bar'), 'foo'),
          noDefault: optional(oneOf('foo', 'bar')),
        },
      }, true).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { hasDefault?: "foo" | "bar" | undefined; noDefault?: "foo" | "bar" | undefined; };')
    })

    it('should generate the validated type for objects', () => {
      expect(generateTypes({
        test: object,
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { [key in string]: any; };')

      expect(generateTypes({
        test: object({}),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = {};')

      expect(generateTypes({
        test: object({
          s: string,
          n: number,
          b: boolean,
          x: null,
        }),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { s: string; n: number; b: boolean; x: null; };')

      expect(generateTypes({
        test: object({
          n: optional(number),
          x: never,
        }),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { n?: number | undefined; x?: undefined; };')

      expect(generateTypes({
        test: object({
          s: string,
          ...allowAdditionalProperties,
        }),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { s: string; } & { [key in string]: any; };')

      expect(generateTypes({
        test: object({
          s: string,
          ...allowAdditionalProperties(),
        }),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { s: string; } & { [key in string]: any; };')

      expect(generateTypes({
        test: object({
          s: string,
          ...allowAdditionalProperties(number),
        }),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { s: string; } & { [key in string]: number; };')

      expect(generateTypes({
        test: object({
          ...allowAdditionalProperties(number),
        }),
      }).replace(/\s+/gm, ' '))
          .toStrictlyEqual('export type test = { [key in string]: number; };')
    })
  })

  describe('Input types', () => {
    it('should generate the input type for booleans', () => {
      expect(generateTypes({
        test: boolean,
      }, true)).toStrictlyEqual('export type test = boolean;')

      expect(generateTypes({
        test: boolean({ fromString: true }),
      }, true)).toStrictlyEqual('export type test = boolean | "true" | "false";')
    })

    it('should generate the input type for arrays', () => {
      expect(generateTypes({
        test: array,
      }, true)).toStrictlyEqual('export type test = any[];')

      expect(generateTypes({
        test: arrayOf(string),
      }, true)).toStrictlyEqual('export type test = string[];')

      expect(generateTypes({
        test: arrayOf(url),
      }, true)).toStrictlyEqual('export type test = (URL | string)[];')
    })

    it('should generate the input type for (branded) bigints', () => {
      expect(generateTypes({
        test: bigint({}),
      }, true)).toStrictlyEqual('export type test = bigint | number;')

      expect(generateTypes({
        test: bigint({ fromString: true }),
      }, true)).toStrictlyEqual('export type test = bigint | number | string;')

      expect(generateTypes({
        test: bigint({ fromNumber: false }),
      }, true)).toStrictlyEqual('export type test = bigint;')

      expect(generateTypes({
        test: bigint({ brand: 'foo' }),
      }, true)).toStrictlyEqual('export type test = bigint | number;')
    })

    it('should generate the input type for (branded) numbers', () => {
      expect(generateTypes({
        test: number({}),
      }, true)).toStrictlyEqual('export type test = number;')

      expect(generateTypes({
        test: number({ fromString: true }),
      }, true)).toStrictlyEqual('export type test = number | string;')

      expect(generateTypes({
        test: number({ brand: 'foo' }),
      }, true)).toStrictlyEqual('export type test = number;')
    })

    it('should generate the input type for (branded) strings', () => {
      expect(generateTypes({
        test: string({}),
      }, true)).toStrictlyEqual('export type test = string;')

      expect(generateTypes({
        test: string({ brand: 'foo' }),
      }, true)).toStrictlyEqual('export type test = string;')
    })

    it('should generate the input type for dates', () => {
      expect(generateTypes({
        test: date,
      }, true)).toStrictlyEqual('export type test = Date | number | string;')

      expect(generateTypes({
        test: date({ format: 'iso' }),
      }, true)).toStrictlyEqual('export type test = string;')

      expect(generateTypes({
        test: date({ format: 'timestamp' }),
      }, true)).toStrictlyEqual('export type test = number;')
    })
  })

  describe('Extra validators', () => {
    it('ean 13', () => {
      expect(generateTypes({
        test: ean13,
      }).replace(/\s+/gm, ' ').trim())
          .toStrictlyEqual('export type test = string & { __ean_13: never; };')

      expect(generateTypes({
        test: new EAN13Validator(),
      }).replace(/\s+/gm, ' ').trim())
          .toStrictlyEqual('export type test = string & { __ean_13: never; };')
    })

    it('url', () => {
      expect(generateTypes({
        test: url,
      })).toStrictlyEqual('export type test = URL;')

      expect(generateTypes({
        test: new URLValidator(),
      })).toStrictlyEqual('export type test = URL;')
    })

    it('uuid', () => {
      expect(generateTypes({
        test: uuid,
      }).replace(/\s+/gm, ' ').trim())
          .toStrictlyEqual('export type test = string & { __uuid: never; };')

      expect(generateTypes({
        test: new UUIDValidator(),
      }).replace(/\s+/gm, ' ').trim())
          .toStrictlyEqual('export type test = string & { __uuid: never; };')
    })
  })

  describe('Extra validators input types', () => {
    it('ean 13', () => {
      expect(generateTypes({
        test: ean13,
      }, true)).toStrictlyEqual('export type test = number | string;')

      expect(generateTypes({
        test: new EAN13Validator(),
      }, true)).toStrictlyEqual('export type test = number | string;')
    })

    it('url', () => {
      expect(generateTypes({
        test: url,
      }, true)).toStrictlyEqual('export type test = URL | string;')

      expect(generateTypes({
        test: new URLValidator(),
      }, true)).toStrictlyEqual('export type test = URL | string;')
    })

    it('uuid', () => {
      expect(generateTypes({
        test: uuid,
      }, true)).toStrictlyEqual('export type test = string;')

      expect(generateTypes({
        test: new UUIDValidator(),
      }, true)).toStrictlyEqual('export type test = string;')
    })
  })

  describe('DTS generation', () => {
    it('should reference exported validators in validated types', () => {
      // this will be exported, but as it's a core type will never be aliased
      const ean = ean13
      // this will be embedded in product below because it's not exported
      const price = number({ brand: 'price', minimum: 0, multipleOf: 0.01 })
      // this will be referenced in the product below because it's exported
      const description = string({ minLength: 1, maxLength: 100 })
      // object mapping two validators above
      const product = object({ ean, price, description })

      // what we expect to see...
      const expected = `
        export type ean = string & { __ean_13: never; };
        export type product = {
          ean: string & { __ean_13: never; };
          price: number & { __brand_price: never; };
          description: description;
        };
        export type description = string;`
          .replace(/\s+/gm, ' ').trim()

      // run our little test...
      expect(generateTypes({ ean, product, description })
          .replace(/\s+/gm, ' ').trim())
          .toStrictlyEqual(expected)
    })


    it('should generate a full type declaration', () => {
      // this will be exported...
      const ean = ean13
      // this also will be exported, but has same input and output type
      const description = string({ minLength: 1 })
      // this will be embedded in product below
      const price = number({ brand: 'price', minimum: 0, multipleOf: 0.01 })
      // object mapping two validators above
      const productValidation = object({ ean, description, price })
      // this is an export aliasing "uuid" as "test"
      const testValidator = ean

      const result = generateDeclarations({
        ean,
        description,
        productValidation,
        testValidator,
      })

      log.info(result)

      expect(result.split('\n').map((s) => s.trim())).toEqual(`
        /* ----- ean ---------------------------------------------------------------- */
        /** Validated type for {@link ean} */
        export type Ean = string & {
            __ean_13: never;
        };
        /** Input type for {@link ean} */
        export type EanInput = number | string;
        /** The \`ean\` validator */
        export const ean: import("justus").Validator<Ean>;
        /* ----- description -------------------------------------------------------- */
        /** Validated type for {@link description} */
        export type Description = string;
        /** Input type for {@link description} */
        export type DescriptionInput = Description;
        /** The \`description\` validator */
        export const description: import("justus").Validator<Description>;
        /* ----- productValidation -------------------------------------------------- */
        /** Validated type for {@link productValidation} */
        export type Product = {
            ean: Ean;
            description: Description;
            price: number & {
                __brand_price: never;
            };
        };
        /** Input type for {@link productValidation} */
        export type ProductInput = {
            ean: EanInput;
            description: DescriptionInput;
            price: number;
        };
        /** The \`productValidation\` validator */
        export const productValidation: {
            readonly ean: import("justus").Validator<Ean>;
            readonly description: import("justus").Validator<Description>;
            readonly price: import("justus").Validator<number & {
                __brand_price: never;
            }>;
        };
        /* ----- testValidator ------------------------------------------------------ */
        /** Validated type for {@link testValidator} */
        export type Test = Ean;
        /** Input type for {@link testValidator} */
        export type TestInput = EanInput;
        /** The \`testValidator\` validator */
        export const testValidator: import("justus").Validator<Ean>;`
          .split('\n').slice(1).map((s) => s.trim()))
    })

    it('should generate a full type declaration for constants', () => {
      const result = generateDeclarations({
        nullValidator: null,
        numberValidator: 12345,
        stringValidator: 'foo',
        trueValidator: true,
        falseValidator: false,
      })

      log.info(result)

      expect(result.split('\n').map((s) => s.trim())).toEqual(`
        /* ----- nullValidator ------------------------------------------------------ */
        /** Validated type for {@link nullValidator} */
        export type Null = null;
        /** Input type for {@link nullValidator} */
        export type NullInput = Null;
        /** The \`nullValidator\` validator */
        export const nullValidator: Null;
        /* ----- numberValidator ---------------------------------------------------- */
        /** Validated type for {@link numberValidator} */
        export type Number = 12345;
        /** Input type for {@link numberValidator} */
        export type NumberInput = Number;
        /** The \`numberValidator\` validator */
        export const numberValidator: Number;
        /* ----- stringValidator ---------------------------------------------------- */
        /** Validated type for {@link stringValidator} */
        export type String = "foo";
        /** Input type for {@link stringValidator} */
        export type StringInput = String;
        /** The \`stringValidator\` validator */
        export const stringValidator: String;
        /* ----- trueValidator ------------------------------------------------------ */
        /** Validated type for {@link trueValidator} */
        export type True = true;
        /** Input type for {@link trueValidator} */
        export type TrueInput = True;
        /** The \`trueValidator\` validator */
        export const trueValidator: True;
        /* ----- falseValidator ----------------------------------------------------- */
        /** Validated type for {@link falseValidator} */
        export type False = false;
        /** Input type for {@link falseValidator} */
        export type FalseInput = False;
        /** The \`falseValidator\` validator */
        export const falseValidator: False;`
          .split('\n').slice(1).map((s) => s.trim()))
    })

    it('should generate a full type declaration a schema with additional properties', () => {
      const result = generateDeclarations({
        myObjectValidator: {
          foo: string,
          ...allowAdditionalProperties,
        },
      })

      log.info(result)

      expect(result.split('\n').map((s) => s.trim())).toEqual(`
        /* ----- myObjectValidator -------------------------------------------------- */
        /** Validated type for {@link myObjectValidator} */
        export type MyObject = {
            foo: string;
        } & {
            [key in string]: any;
        };
        /** Input type for {@link myObjectValidator} */
        export type MyObjectInput = MyObject;
        /** The \`myObjectValidator\` validator */
        export const myObjectValidator: {
            readonly foo: import("justus").Validator<string>;
            readonly [Symbol.justusAdditionalValidator]: import("justus").Validator<any>;
        };`.split('\n').slice(1).map((s) => s.trim()))
    })

    it('should generate a full type declaration a schema with no additional properties', () => {
      const result = generateDeclarations({
        myObjectValidator: {
          foo: string,
          ...allowAdditionalProperties(false),
        },
      })

      log.info(result)

      expect(result.split('\n').map((s) => s.trim())).toEqual(`
        /* ----- myObjectValidator -------------------------------------------------- */
        /** Validated type for {@link myObjectValidator} */
        export type MyObject = {
            foo: string;
        };
        /** Input type for {@link myObjectValidator} */
        export type MyObjectInput = MyObject;
        /** The \`myObjectValidator\` validator */
        export const myObjectValidator: {
            readonly foo: import("justus").Validator<string>;
        };`.split('\n').slice(1).map((s) => s.trim()))
    })

    it('should generate a full type declaration a schema with explicit additional properties', () => {
      const result = generateDeclarations({
        myObjectValidator: {
          foo: string,
          ...allowAdditionalProperties(number),
        },
      })

      log.info(result)

      expect(result.split('\n').map((s) => s.trim())).toEqual(`
        /* ----- myObjectValidator -------------------------------------------------- */
        /** Validated type for {@link myObjectValidator} */
        export type MyObject = {
            foo: string;
        } & {
            [key in string]: number;
        };
        /** Input type for {@link myObjectValidator} */
        export type MyObjectInput = MyObject;
        /** The \`myObjectValidator\` validator */
        export const myObjectValidator: {
            readonly foo: import("justus").Validator<string>;
            readonly [Symbol.justusAdditionalValidator]: import("justus").Validator<number>;
        };`.split('\n').slice(1).map((s) => s.trim()))
    })

    it('should generate a full type declaration for wrapped tuples', () => {
      const result = generateDeclarations({ myTuple: tuple([ string, number ]) })

      log.info(result)

      expect(result.split('\n').map((s) => s.trim())).toEqual(`
        /* ----- myTuple ------------------------------------------------------------ */
        /** Validated type for {@link myTuple} */
        export type MyTuple = [
          string,
          number
        ];
        /** Input type for {@link myTuple} */
        export type MyTupleInput = MyTuple;
        /** The \`myTuple\` validator */
        export const myTuple: import("justus").Validator<MyTuple>;`
          .split('\n').slice(1).map((s) => s.trim()))
    })

    it('should fail generating a full type declaration including straight tuples', () => {
      expect(() => generateDeclarations({ noTuples: [ string ] }))
          .toThrowError(TypeError, 'Unable to generate variable declaration for TupleValidator')
    })
  })
})
