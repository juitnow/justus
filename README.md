<p align="center">
  <img src="https://raw.githubusercontent.com/juitnow/justus/main/LOGO.svg" alt="logo">
</p>

JUSTUS
======

> _"**justus**"_ (latin, adj.): _"proper"_ or _"correct"_.

JUSTUS is a very simple library for _validating_ JavaScript objects and
properly _annotating_ them with TypeScript types.

It focuses in providing an _easy_ and _terse_ syntax to define a simple schema,
used to ensure that an object is _**correct**_ and from which _**proper**_
typing can be inferred.

* [Quick Start](#quick-start)
* Validators
  * [Strings](#string-validator)
  * [Numbers](#number-validator)
  * [Booleans](#boolean-validator)
  * [Constants](#constant-validator)
  * [Any](#any-validator)
  * [Arrays](#array-validator)
  * [Dates](#date-validator)
  * [Tuples](#tuple-validator)
  * [Objects](#object-validator) (yes, this is the important one!!!)
  * [Any of, all of](#union-validators)
* [A (slightly more) complex example](#a-complex-example)
* [Copyright Notice](NOTICE.md)
* [License](LICENSE.md)


Quick Start
-----------

You can use JUSTUS in your projects quite simply: import, write a schema and
validate. For example:

```typescript
import { validate, object, string, number } from 'justus'

// Create a validator, validating _objects_ with a specific schema
const validator = object({

  // The "foo" property in the objects to validate must be a "string"
  // with a minimum length of one character
  foo: string({ minLength: 1 }),

  // The "bar" property in the objects to validate must be a "number"
  bar: number,

// Always use `as const`: it correctly infers types for constants, tuples, ...
} as const)

// Use the validator to validate the object specified as the second argument
const validated = validate(validator, { foo: 'xyz', bar: 123 })

validated.foo // <-- its type will be "string"
validated.bar // <-- its type will be "number"
```

Easy, terse, ultimately very readable... And all types are inferred!

#### Shorthand syntax

The `validate` function (or anywhere a _validation_ is needed) can accept a
_shorthand_ inline syntax. From our example above:

```typescript
const validated = validate({
  foo: string({ minLength: 1 }),
  bar: number,
} as const, {
  foo: 'xyz',
  bar: 123,
})
```

... you get the drill! See below in each _validator_ for their shorthand syntax.


String Validator
----------------

String validators are created using the `string` function:

```typescript
import { string } from 'justus'

const s1 = string() // validates any string
const s2 = string({ minLength: 1 }) // validate non empty strings
```

#### Options

* `minLength?: number`: The _minimum_ length of a valid `string`
* `maxLength?: number`: The _maximum_ length of a valid `string`
* `pattern?: RegExp`: A `RegExp` enforcing a particular pattern for a valid `string`

#### Branded strings

Type _branding_ can be used for string primitives. For example:

```typescript
import { string, validate } from 'justus'

type UUID = string & { __brand_uuid: never }

const uuidValidator = string<UUID>({
  pattern: /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/,
  minLength: 36,
  maxLength: 36,
})

const value = validate(uuidValidator, 'C274773D-1444-41E1-9D3A-9F9D584FE8B5')

value = 'foo' // <- will fail, as "foo" is a `string`, while "value" is a `UUID`
```

#### Implicit branding

Sometimes it might be useful to declare the _branding_ of a string without
recurring to an external type. We can easily do so by adding the `brand`
property our string constraints. Following the example above:

```typescript
import { string } from 'justus'

const uuidValidator = string({
  pattern: /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/,
  minLength: 36,
  maxLength: 36,
  brand: 'uuid',
})

const value = validate(uuidValidator, 'C274773D-1444-41E1-9D3A-9F9D584FE8B5')

value = 'foo' // <- fail! the type of "value" is "string & __brand_uuid: never"
```

#### Shorthand syntax

The shorthand syntax for string validators is simply `string`. For example:

```typescript
import { string } from 'justus'

const validator = object({
  foo: string // yep, no parenthesis, just "string"
})
```


Number Validator
----------------

Number validators are created using the `number` function:

```typescript
import { number } from 'justus'

const n1 = number() // validates any number
const n2 = number({ minimum: 123 }) // validate numbers 123 and greater
```

#### Options

* `multipleOf?: number`: The value for which a `number` must be multiple of for it to be valid
* `maximum?: number`: The _inclusive_ maximum value for a valid `number`
* `minimum?: number`: The _inclusive_ minimum value for a valid `number`
* `exclusiveMaximum?: number`: The _exclusive_ maximum value for a valid `number`
* `exclusiveMinimum?: number`: The _exclusive_ minimum value for a valid `number`
* `allowNaN?: boolean`: Whether to allow `NaN` or not (default: `false`)

#### Branded numbers

Type _branding_ can be used for number primitives. For example:

```typescript
import { number } from 'justus'

type Price = number & { __brand_price: never }

const priceValidator = number<Price>({
  multipleOf: 0.01, // cents, anyone? :-)
  minimum: 0, // no negative prices, those are _discounts_
})

const value = validate(priceValidator, 123.45)

value = 432 // <- will fail, as 432 is a `number`, while "value" is a `Price`
```

#### Implicit branding

Sometimes it might be useful to declare the _branding_ of a number without
recurring to an external type. We can easily do so by adding the `brand`
property our number constraints. Following the example above:

```typescript
import { number } from 'justus'

const priceValidator = number({
  multipleOf: 0.01, // cents, anyone? :-)
  minimum: 0, // no negative prices, those are _discounts_
  brand: 'price',
})

const value = validate(priceValidator, 123.45)

value = 432 // <- fail! the type of "value" is "number & __brand_price: never"
```

#### Shorthand syntax

The shorthand syntax for number validators is simply `number`. For example:

```typescript
import { number } from 'justus'

const validator = object({
  foo: number // yep, no parenthesis, just "number"
})
```


Boolean Validator
-----------------

The boolean validator is represented by the `boolean` constant:

```typescript
import { boolean, object } from 'justus'

const validator = object({
  foo: boolean // it's a constant, no options!
})
```


Constant Validator
------------------

Cosntant validators are created using the `constant` function:

```typescript
import { constant } from 'justus'

const c1 = constant('foo') // validates the `string` constant "foo"
const c2 = constant(12345) // validates the `number` constant 12345
const c3 = constant(false) // validates the `boolean` constant `false`
const c4 = constant(null) // validates the `null` constant
```

The constant validator requires a `string`, `number`, `boolean` or `null`
constant.

#### Shorthand syntax

The shorthand syntax for constant validators is simply its value. For example:

```typescript
import { object, validate } from 'justus'

const validator = object({
  foo: 'foo', // the string "foo"
  bar: 12345, // the number 12345
  baz: false, // the boolean false
  nil: null, // the null constant
} as const) // yep, don't forget "as const" to infer types correctly

const result = validate(validator, something)

result.foo // <- its type will be `"foo"` (or "string" if you didn't use "as const")
result.bar // <- its type will be `12345` (or "number" if you didn't use "as const")
result.baz // <- its type will be `false` (or "boolean" if you didn't use "as const")
result.nil // <- its type will be `null` (or "any" if you didn't use "as const")
```


Any Validator
-------------

The _any_ validator is represented by the `any` constant:

```typescript
import { any, object, validate } from 'justus'

const validator = object({
  foo: any // it's a constant, no options!
})

const result = validate(validator, something)

result.foo // <- its type will be `any`
```


Array Validator
---------------

Array validators are created using the `array` or `arrayOf` functions:

```typescript
import { array, arrayOf, number, string } from 'justus'

const a1 = array() // validates any array
const a2 = string({ maxItems: 10, items: string }) // array of strings
const a3 = arrayOf(number) // array of numbers
```

#### Options

* `maxItems?: number`: The _maximum_ number of elements a valid `Array`
* `minItems?: number`: The _minimum_ number of elements a valid `Array`
* `uniqueItems?: boolean`: Indicates if the `Array`'s elements must be unique
* `items?: V`: The _type_ of each individual item in the `Array` */

#### Shorthand syntax

The shorthand syntax for string validators is simply `array`. For example:

```typescript
import { array } from 'justus'

const validator = object({
  foo: array // validate any array, of any length, containing anything
})
```

The `arrayOf` function can also be considered a _shorthand_ of the full
`array({ items: ... })`. For example the two following declarations are
equivalent:

```typescript
import { array, arrayOf } from 'justus'

const a1 = array({ items: string })
const a2 = arrayOf(string) // same as above, just more readable
```


Date Validator
--------------

Date validators are created using the `date` function:

```typescript
import { date } from 'justus'

const d1 = date() // validates any date
const d2 = date({ format: 'iso' }) // validate ISO dates
```

> **NOTE:** Date validators also _convert_ dates (in string format), or
> timestamps (milliseconds from the epoch) into proper `Date` instances.

#### Options

* `format?: 'iso' | 'timestamp'`: The format for dates, `iso` for _ISO Dates_
  (as outlined in RFC 3339) or `timestamp` for the number of milliseconds since
  the epoch
* `from?: Date`: The earliest value a date can have
* `until?: Date`: The latest value a date can have

#### Shorthand syntax

The shorthand syntax for number validators is simply `date`. For example:

```typescript
import { date } from 'justus'

const validator = object({
  foo: date // anything that can be converted to `Date` will be!
})
```


Tuple Validator
---------------

A _tuple_ is (by definition) _a finite ordered list (sequence) of elements_.

Tuple validators are created using the `tuple` function:

```typescript
import { tuple, string, number, boolean } from 'justus'

// Validates 3 elements tuple: (in order) a string, a number and a boolean
const t1 = tuple([ string, number, boolean ])

// Validates a tuple whose first element is a string, followed by zero or more
// numbers, and wholse last element is a boolean
const t2 = tuple([ string, ...number, boolean ]) // yay! rest parameters!
```

As shown above, any `Validator` (or one of its shorthands) can be used as a
_rest parameter_ implying zero or more elements of the specified kind.

A more complext example:

```typescript
import { tuple, string, number, object } from 'justus'

const myObject = object({
  version: number,
  title: string,
})

// This is the silliest tuple ever written, but outlines our intentions:
const sillyTuple = tuple([ 'start', ...myObject, 'end' ] as const)

// Validate using our tuple:
validate(tuple, [
  'start', // yep, a constant
  { version: 1, title: 'Hello world' },
  { version: 2, title: 'Foo, bar and baz' },
  'end', // the last
])
```


Object Validator
----------------

As seen in the examples above, object validators are created using the
`object` function:

```typescript
import { object, string, number, boolean } from 'justus'

const o1 = object() // any object (excluding null - darn JavaScript)
const o2 = object({
  foo: string, // any string
  bar: number, // any number
  baz: 'Hello, world!', // the constant "Hello, world!"
} as const)
```

#### Shorthand syntax

The shorthand syntax for object validators is simply `object`. For example:

```typescript
import { arrayOf, object } from 'justus'

const validator = arrayOf(object) // won't validate if the array has numbers, strings, ...
```

#### Allow additional properties

Sometimes it's necessary to allow additional properties in an object.

Destructuring `...allowAdditionalProperties` in an objects does the trick!

```typescript
import { object, string, number, boolean } from 'justus'

const o1 = object({
  foo: string, // any string
  bar: number, // any number
  ...allowAdditionalProperties, // any other key will be "any"
})

const result1 = validate(o1, ... some object ...)

result1.foo // <-- this will be a "string"
result1.bar // <-- this will be a "number"
result1.baz // <-- additional property, this will be "any"

// additional properties with a type

const o2 = object({
  foo: string, // any string
  bar: number, // any number
  ...allowAdditionalProperties(boolean), // any other key will be "boolean"
})

const result2 = validate(o2, ... some object ...)

result2.foo // <-- this will be a "string"
result2.bar // <-- this will be a "number"
result2.baz // <-- additional property, this will be "boolean"
```

Here `allowAdditionalProperties` is also a function, which can take some
parameters to configure its behaviour:

* `...allowAdditionalProperties`: default shorthand, allows additional
  properties and will infer the `any` type for them.
* `...allowAdditionalProperties()`: as a function, and same as above, it allows
  additional properties and will infer the `any` type for them.
* `...allowAdditionalProperties(true)`: as a function, and same as above, it
  allows additional properties and will infer the `any` type for them.
* `...allowAdditionalProperties(false)`: as a function, it _forbids_ any
  additional property in objects, useful when extending objects (see below)
* `...allowAdditionalProperties(... type ...)`: as a function, it allows
  additional properties in objects and ensures their type is correct

#### Extending objects

Simply destructure one into another. For example:

```typescript
import { object, string, number, boolean } from 'justus'

const o1 = object({
  foo: string, // any string
  bar: number, // any number
})

const o2 = object({
  ...o1, // anything part of "o1" will be here as well!
  bar: boolean, // here "bar" is no longer a number, but a boolean
  baz: number, // add the "baz" property as a number
} as const)
```

A slightly more complex scenario arises when considering additional properties
in the base object, but forcedly forbidding them in an extend one.

To do so, simply override in the extended object as follows:

Simply destructure one into another. For example:

```typescript
import { object, string, number, boolean } from 'justus'

const o1 = object({
  foo: string, // any string
  bar: number, // any number
  ...allowAdditionalProperties(boolean), // any other property is a boolean
})

const o2 = object({
  ...o1, // anything part of "o1" will be here as well!
  baz: boolean, // add "baz" to "o1", forcing it to be a "boolean"
  ...allowAdditionaProperties(false), // no more additional properties here!
} as const)
```

#### Ensure properties never exist

When allowing extra properties, or extending objects, we might want to validate
the _non-existance_ of a specific property. We can do this setting a property
to `never`:

```typescript
import { object, string, number, never } from 'justus'

const o1 = object({
  foo: string, // any string
  bar: number, // any number
})

const o2 = object({
  ...o1, // anything part of "o1" will be here as well!
  bar: never, // remove "bar" from the properties inherited by "o1"
} as const)

const o3 = object({
  ...o1, // anything part of "o1" will be here as well!
  ...allowAdditionalProperties, // allow additional properties as "any"
  baz: never, // even with additional properties, "baz" must not exist
} as const)
```

#### Optional and read-only properties

Optional and read-only properties can also be declared in objects:

```typescript
import { object, readonly, optional, string, number, boolean } from 'justus'

const o1 = object({
  foo: string, // any string, but must be a string
  bar: optional(number), // optional property as "number | undefined"
  baz: readonly(boolean), // read-only property as "readonly boolean"
  xxx: readonly(optional(string)) // ... guess what it'll be?
})
```


Union Validators
----------------

Unions (either _all_ or _any_) are defined using the `allOf` or `oneOf`
functions.

To make sure all validations pass use `allOf`:

```typescript
import { allOf, object, string, number } from 'justus'

const o1 = object({ foo: string })
const o2 = object({ bar: number })

const result = validate(allOf(o1, o2), ... some object ...)
// result here will have the type of what's inferred by o1 _and_ o2

result.foo // <-- this is a "string"
result.bar // <-- this is a "number"

// be careful about never!
const result2 = validate(allOf(number, string), ... some primitive ...)
// obviously "result2" will be of type "never" as "number" and "string" do not match!
```

More useful, to make sure all validations pass use `oneOf`:

```typescript
import { oneOf, string, number } from 'justus'

const result = validate(oneOf(number, string), ... some primitive ...)

result // <-- its type will be "number | string"
```


A complex example
-----------------

This example is not complicated at all, but it outlines the simplicity
of the syntax intended for JUSTUS.

Let's assume we have some _time series_ data, but we can expect this in a
couple of different flavors, either V1 or V2 with some subtle differences:

```typescript
import {
  arrayOf,
  date,
  number,
  object,
  oneOf,
  string,
  tuple,
  validate,
} from '../src'

// Our V1 time-series tuple is simply a timestamp followed by a numeric value
const entryv1 = tuple([ date, number ] as const)

// Our V1 response from the time series database declares the version and data
const responsev1 = object({
  version: 1,
  entries: arrayOf(entryv1),
} as const)

// Our V2 time-series tuple is a timestamp, followed by a number and zero or
// more strings indicating some remarks on the measurements
const entryv2 = tuple([ date, number, ...string ] as const)

// Response for V2 is the same as V1, with some extra stuff
const responsev2 = object({
  version: 2,
  entries: arrayOf(entryv2),
  average: number, // this is extra!
} as const)

// Our combined response is either V1 or V2
const response = oneOf(responsev1, responsev2)

// GO! Validate!
const result = validate(response, {})

if (result.version === 1) {
  result.version // the type here will be the literal number 1
  result.entries.forEach((entry) => {
    entry[0] // this will be a `Date` instance
    entry[1] // this will be a "number"
    // entry[2] // will generate a typescript error
  })
  // response.average // will generate a typescript error
} else {
  result.version // the type here will be the literal number 2
  result.entries.forEach((entry) => {
    entry[0] // this will be a `Date` instance
    entry[1] // this will be a "number"
    entry[2] // this will be a "string"
    entry[999] // this too will be a "string"
  })
  result.average // this will be a "number""
}
```
