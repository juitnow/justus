import { ValidationError, validate } from '../src'
import { arn, parseArn } from '../src/extra/arn'

describe('Extra UUID validator', () => {
  describe('Parsed ARNs', () => {
    it('should parse an IAM Role ARN', () => {
      // resources separated by `/`
      expect(validate(parseArn, 'arn:aws:iam::123456789012:role/my-role'))
          .toEqual({
            Arn: 'arn:aws:iam::123456789012:role/my-role',
            Partition: 'aws',
            Service: 'iam',
            Region: '',
            Account: '123456789012',
            Resource: [
              'role',
              'my-role',
            ],
          })
    })

    it('should parse a Lambda Function ARN', () => {
      // resources separated by `:`
      expect(validate(parseArn, 'arn:aws:lambda:xx-somewhere-0:123456789012:function:my-function-name'))
          .toEqual({
            Arn: 'arn:aws:lambda:xx-somewhere-0:123456789012:function:my-function-name',
            Partition: 'aws',
            Service: 'lambda',
            Region: 'xx-somewhere-0',
            Account: '123456789012',
            Resource: [
              'function',
              'my-function-name',
            ] })
    })

    it('should parse a SQS Queue ARN', () => {
      // only one resource
      expect(validate(parseArn, 'arn:aws:sqs:xx-somewhere-0:123456789012:my-queue'))
          .toEqual({
            Arn: 'arn:aws:sqs:xx-somewhere-0:123456789012:my-queue',
            Partition: 'aws',
            Service: 'sqs',
            Region: 'xx-somewhere-0',
            Account: '123456789012',
            Resource: [ 'my-queue' ],
          })
    })

    it('should parse an ARN matching the service', () => {
      expect(validate(parseArn('service'), 'arn:partition:service:region:account:resource'))
          .toEqual({
            Arn: 'arn:partition:service:region:account:resource',
            Partition: 'partition',
            Service: 'service',
            Region: 'region',
            Account: 'account',
            Resource: [ 'resource' ],
          })
    })

    it('should accept a slightly malformed ARN', () => {
      expect(validate(parseArn('service'), 'arn:partition:service:region:account:resource/foo:bar'))
          .toEqual({
            Arn: 'arn:partition:service:region:account:resource/foo', // no "bar"
            Partition: 'partition',
            Service: 'service',
            Region: 'region',
            Account: 'account',
            Resource: [ 'resource', 'foo' ], // no "bar"
          })
    })
  })

  describe('String ARNs', () => {
    it('should parse an IAM Role ARN', () => {
      // resources separated by `/`
      expect(validate(arn, 'arn:aws:iam::123456789012:role/my-role'))
          .toStrictlyEqual('arn:aws:iam::123456789012:role/my-role')
    })

    it('should parse a Lambda Function ARN', () => {
      // resources separated by `:`
      expect(validate(arn, 'arn:aws:lambda:xx-somewhere-0:123456789012:function:my-function-name'))
          .toStrictlyEqual('arn:aws:lambda:xx-somewhere-0:123456789012:function:my-function-name')
    })

    it('should parse a SQS Queue ARN', () => {
      // only one resource
      expect(validate(arn, 'arn:aws:sqs:xx-somewhere-0:123456789012:my-queue'))
          .toStrictlyEqual('arn:aws:sqs:xx-somewhere-0:123456789012:my-queue')
    })

    it('should parse an ARN matching the service', () => {
      expect(validate(arn('service'), 'arn:partition:service:region:account:resource'))
          .toStrictlyEqual('arn:partition:service:region:account:resource')
    })

    it('should accept a slightly malformed ARN', () => {
      expect(validate(arn('service'), 'arn:partition:service:region:account:resource/foo:bar'))
          .toStrictlyEqual('arn:partition:service:region:account:resource/foo')
    })
  })

  describe('Invalid ARNs', () => {
    it('should fail when the prefix is not "arn:"', () => {
      expect(() => validate(arn, 'xxx:aws:sqs:xx-somewhere-0:123456789012:my-queue'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error$/m)
              .toHaveProperty('errors', expect.toEqual([ {
                path: [],
                message: 'ARN must start with "arn:"',
              } ])))
    })

    it('should fail when a required component is missing', () => {
      expect(() => validate(arn, 'arn::service:region:account:resource'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error$/m)
              .toHaveProperty('errors', expect.toEqual([ {
                path: [],
                message: 'Missing partition in ARN',
              } ])))

      expect(() => validate(arn, 'arn:aws::region:account:resource'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error$/m)
              .toHaveProperty('errors', expect.toEqual([ {
                path: [],
                message: 'Missing service in ARN',
              } ])))

      expect(() => validate(arn, 'arn:aws:service:region::resource'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error$/m)
              .toHaveProperty('errors', expect.toEqual([ {
                path: [],
                message: 'Missing account ID in ARN',
              } ])))

      expect(() => validate(arn, 'arn:aws:service:region:account'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error$/m)
              .toHaveProperty('errors', expect.toEqual([ {
                path: [],
                message: 'Invalid components in ARN',
              } ])))

      expect(() => validate(arn, 'arn:aws:service:region:account:'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error$/m)
              .toHaveProperty('errors', expect.toEqual([ {
                path: [],
                message: 'Missing resource ID in ARN',
              } ])))

      expect(() => validate(arn, 'arn:aws:service:region:account:/'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error$/m)
              .toHaveProperty('errors', expect.toEqual([ {
                path: [],
                message: 'Invalid resource ID in ARN',
              } ])))
    })

    it('should fail when the service is mismatched', () => {
      expect(() => validate(arn('correct'), 'arn:aws:wrong:region:account:/'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error$/m)
              .toHaveProperty('errors', expect.toEqual([ {
                path: [],
                message: 'ARN Service "wrong" mismatch (expected "correct")',
              } ])))

      expect(() => validate(parseArn('correct'), 'arn:aws:wrong:region:account:/'))
          .toThrow((assert) => assert
              .toBeError(ValidationError, /^Found 1 validation error$/m)
              .toHaveProperty('errors', expect.toEqual([ {
                path: [],
                message: 'ARN Service "wrong" mismatch (expected "correct")',
              } ])))
    })
  })
})
