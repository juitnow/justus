import { constant, optional, string, url, validate, ValidationError } from '../src/index'
import { expect } from 'chai'

describe('URL validator', () => {
  it('should validate a simple URL', () => {
    expect(validate(url, 'http://www/').href).to.equal('http://www/')
    expect(validate(url, 'foo:bar/baz').href).to.equal('foo:bar/baz')
    expect(validate(url, new URL('http://www/')).href).to.equal('http://www/')
  })

  it('should not validate a wrong URL', () => {
    expect(() => validate(url, '/foo/bar'))
        .to.throw(ValidationError, 'Value could not be converted to a "URL"')
  })

  it('should validate an URL with some basic constraints', () => {
    const validator = url({
      protocol: string({ pattern: /^https?:$/ }),
      hostname: constant('www'),
      pathname: '/a/b/c',
      hash: undefined, // have the key but no value
    })

    expect(validator.validate('http://www/a/b/c#foo').href).to.equal('http://www/a/b/c#foo')

    expect(() => validator.validate('ftp://funet/fi'))
        .to.throw(ValidationError, 'Found 3 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'protocol' ], message: 'String does not match required pattern /^https?:$/' },
          { path: [ 'hostname' ], message: 'Value does not match constant "www"' },
          { path: [ 'pathname' ], message: 'Value does not match constant "/a/b/c"' },
        ])
  })

  it('should validate an URL with some search parameters constraints', () => {
    const validator = url({
      searchParams: {
        foo: 'bar',
        baz: optional('xyz'),
      },
    })

    expect(validator.validate('http://www/?foo=bar&baz=xyz').href).to.eql('http://www/?foo=bar&baz=xyz')
    expect(() => validator.validate('http://www/?baz=abc').href)
        .to.throw(ValidationError, 'Found 2 validation errors')
        .with.property('errors').to.eql([
          { path: [ 'searchParams', 'foo' ], message: 'Required property missing' },
          { path: [ 'searchParams', 'baz' ], message: 'Value does not match constant "xyz"' },
        ])
  })
})
