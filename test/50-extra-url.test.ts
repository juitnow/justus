import { constant, optional, string, validate, ValidationError } from '../src'
import { url } from '../src/extra/url'

describe('URL validator', () => {
  it('should validate a simple URL', () => {
    expect(validate(url, 'http://www/').href).toStrictlyEqual('http://www/')
    expect(validate(url, 'foo:bar/baz').href).toStrictlyEqual('foo:bar/baz')
    expect(validate(url, new URL('http://www/')).href).toStrictlyEqual('http://www/')
  })

  it('should not validate a wrong URL', () => {
    expect(() => validate(url, '/foo/bar'))
        .toThrowError(ValidationError, /Value could not be converted to a "URL"/)
  })

  it('should validate an URL with some basic constraints', () => {
    const validator = url({
      protocol: string({ pattern: /^https?:$/ }),
      hostname: constant('www'),
      pathname: '/a/b/c',
      hash: undefined, // have the key but no value
    })

    expect(validator.validate('http://www/a/b/c#foo').href).toStrictlyEqual('http://www/a/b/c#foo')

    expect(() => validator.validate('ftp://funet/fi'))
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 3 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'protocol' ], message: 'String does not match required pattern /^https?:$/' },
              { path: [ 'hostname' ], message: 'Value does not match constant "www" (string)' },
              { path: [ 'pathname' ], message: 'Value does not match constant "/a/b/c" (string)' },
            ])))
  })

  it('should validate an URL with some search parameters constraints', () => {
    const validator = url({
      searchParams: {
        foo: 'bar',
        baz: optional('xyz'),
      },
    })

    expect(validator.validate('http://www/?foo=bar&baz=xyz').href).toEqual('http://www/?foo=bar&baz=xyz')
    expect(() => validator.validate('http://www/?baz=abc').href)
        .toThrow((assert) => assert
            .toBeError(ValidationError, /^Found 2 validation errors/)
            .toHaveProperty('errors', expect.toMatchContents([
              { path: [ 'searchParams', 'foo' ], message: 'Required property missing' },
              { path: [ 'searchParams', 'baz' ], message: 'Value does not match constant "xyz" (string)' },
            ])))
  })
})
