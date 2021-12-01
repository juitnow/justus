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
  * [Objects](#object-validator)
  * [Any of, all of](#union-validator)
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
import { string } from 'justus'

type UUID = string & { __brand_uuid: never }

const uuidValidator = string<UUID>({
  pattern: /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/,
  minLength: 36,
  maxLength: 36,
})

const value = validate(uuidValidator, 'C274773D-1444-41E1-9D3A-9F9D584FE8B5')

value = 'foo' // <- will fail, as "foo" is a `string`, while "value" is a `UUID`
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

type Price = string & { __brand_price: never }

const priceValidator = number<Price>({
  multipleOf: 0.01, // cents, anyone? :-)
  minimum: 0, // no negative prices, those are _discounts_
})

const value = validate(priceValidator, 123.45)

value = 432 // <- will fail, as 432 is a `number`, while "value" is a `Price`
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
