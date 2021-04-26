'use strict'

const service          = require('example')
const { expect }       = require('chai')
const { Identity }     = require('@kravc/identity')
const canonicalize     = require('canonicalize')
const { createHash }   = require('crypto')
const DidAuthorization = require('./DidAuthorization')
const createAuthorization   = require('../helpers/createAuthorization')
const { test: { execute } } = require('@kravc/dos')

const exec = execute(service)

const identity = '72ff16adfaa40ccdf8a8e5e0a53612c621da522d2e49bc4e352dece23f30bc63'

const getAuthorization = async (domain, parameters) => {
  const _identity = await Identity.fromSeed(identity)

  const proofOptions = {}

  if (domain) {
    proofOptions.domain = domain
  }

  if (parameters) {
    const canonicalizedParameters = canonicalize(parameters)
    const challenge = createHash('sha256').update(canonicalizedParameters).digest().toString('hex')

    proofOptions.challenge = challenge
  }

  const jwt = await _identity.createPresentation([], { format: 'jwt', proofOptions })

  return jwt
}

describe('DidAuthorization', () => {
  let requirementInstance

  before(() => {
    const requirement = DidAuthorization.createRequirement()
    const options = requirement.DidAuthorization

    requirementInstance = new requirement.DidAuthorization.klass(options)
  })

  describe('createRequirement(options = {})', () => {
    it('creates requirement with default verification methods', async () => {
      expect(requirementInstance._verifyAccess()).to.eql([ true ])
    })
  })

  describe('verify(context)', () => {
    const parameters = {
      mutation: {
        username: 'Flamie'
      }
    }

    it('verifies signed HTTP requests', async () => {
      const operationId   = 'CreateAccountCredential'
      const authorization = await getAuthorization(`${service.baseUrl}${operationId}`, parameters)

      const context = {
        query:    {},
        baseUrl:  service.baseUrl,
        headers:  { authorization },
        httpPath: `/${operationId}`,
        bodyJson: canonicalize(parameters),
        operationId
      }

      const { isAuthorized } = await requirementInstance.verify(context)

      expect(isAuthorized).to.be.true
    })

    it('throws "UnauthorizedError" if authorization header missing', async () => {
      const { statusCode, result: { error } } = await exec('CreateAccountCredential', parameters)

      expect(statusCode).to.eql(401)
      expect(error.code).to.eql('UnauthorizedError')
      expect(error.message).to.eql('Authorization header is missing')
    })

    it('throws "UnauthorizedError" if token verification failed', async () => {
      const authorization = 'INVALID_TOKEN'
      const { statusCode, result: { error } } = await exec('CreateAccountCredential', parameters, { authorization })

      expect(statusCode).to.eql(401)
      expect(error.code).to.eql('UnauthorizedError')
      expect(error.message).to.include('Presentation verification error:')
    })

    it('throws "UnauthorizedError" if no proof domain', async () => {
      const authorization = await getAuthorization(null, parameters)
      const { statusCode, result: { error } } = await exec('CreateAccountCredential', parameters, { authorization })

      expect(statusCode).to.eql(401)
      expect(error.code).to.eql('UnauthorizedError')
      expect(error.message).to.eql('Presentation proof should include domain')
    })

    it('throws "UnauthorizedError" if proof domain mismatch', async () => {
      const authorization = await getAuthorization('https://invalid.domain.com', parameters)
      const { statusCode, result: { error } } = await exec('CreateAccountCredential', parameters, { authorization })

      expect(statusCode).to.eql(401)
      expect(error.code).to.eql('UnauthorizedError')
      expect(error.message).to.include('Presentation proof domain should start with')
    })

    it('throws "UnauthorizedError" if request url doesn\'t match proof domain', async () => {
      const operationId   = 'CreateAccountCredential'
      const authorization = await getAuthorization(`${service.baseUrl}${operationId}`, parameters)

      const context = {
        query:    {},
        baseUrl:  service.baseUrl,
        headers:  { authorization },
        httpPath: `/${operationId}1`,
        operationId
      }

      const { isAuthorized, error } = await requirementInstance.verify(context)

      expect(isAuthorized).to.be.false
      expect(error.message).to.eql('Request URL doesn\'t match presentation proof domain')
    })

    it('throws "UnauthorizedError" if request query parameters do not match proof domain', async () => {
      const operationId   = 'CreateAccountCredential'
      const authorization = await getAuthorization(`${service.baseUrl}${operationId}`, parameters)

      const context = {
        query:    { extra: 'parameter' },
        baseUrl:  service.baseUrl,
        headers:  { authorization },
        httpPath: `/${operationId}`,
        operationId
      }

      const { isAuthorized, error } = await requirementInstance.verify(context)

      expect(isAuthorized).to.be.false
      expect(error.message).to.eql('Request query parameters do not match presentation proof domain')
    })

    it('throws "UnauthorizedError" if no proof challenge', async () => {
      const operationId   = 'CreateAccountCredential'
      const authorization = await getAuthorization(`${service.baseUrl}${operationId}`)

      const context = {
        query:    {},
        baseUrl:  service.baseUrl,
        headers:  { authorization },
        httpPath: `/${operationId}`,
        bodyJson: JSON.stringify(parameters),
        operationId
      }

      const { isAuthorized, error } = await requirementInstance.verify(context)

      expect(isAuthorized).to.be.false
      expect(error.message).to.eql('Presentation proof should include challenge, sha256 from body JSON')
    })

    it('throws "UnauthorizedError" if request body doesn\'t match proof challenge', async () => {
      const operationId   = 'CreateAccountCredential'
      const authorization = await getAuthorization(`${service.baseUrl}${operationId}`, { ...parameters, extra: 'parameter' })

      const context = {
        query:    {},
        baseUrl:  service.baseUrl,
        headers:  { authorization },
        httpPath: `/${operationId}`,
        bodyJson: JSON.stringify(parameters),
        operationId
      }

      const { isAuthorized, error } = await requirementInstance.verify(context)

      expect(isAuthorized).to.be.false
      expect(error.message).to.eql('Request body JSON doesn\'t match presentation proof challenge')
    })

    it('throws "UnauthorizedError" if operation parameters doesn\'t match proof challenge', async () => {
      const authorization = await getAuthorization(`${service.baseUrl}CreateAccountCredential`, { ...parameters, extra: 'parameter' })
      const { statusCode, result: { error } } = await exec('CreateAccountCredential', parameters, { authorization })

      expect(statusCode).to.eql(401)
      expect(error.code).to.eql('UnauthorizedError')
      expect(error.message).to.include('Operation parameters do not match presentation proof challenge')
    })

    it('throws "AccessDeniedError" if access verification method failed', async () => {
      const authorization = await createAuthorization(identity, service.baseUrl, 'CreateAccountCredential', parameters)
      const { statusCode, result: { error } } = await exec('CreateAccountCredential', parameters, { authorization })

      expect(statusCode).to.eql(403)
      expect(error.code).to.eql('AccessDeniedError')
      expect(error.message).to.eql('Access denied')
    })
  })
})
