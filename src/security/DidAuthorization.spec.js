'use strict'

const service               = require('examples/accounts')
const { expect }            = require('chai')
const { Identity }          = require('@kravc/identity')
const DidAuthorization      = require('./DidAuthorization')
const { test: { execute } } = require('@kravc/dos')
const { test: { createDidAuthToken } } = require('src')

const exec = execute(service)

const CLIENT_SEED = '72ff16adfaa40ccdf8a8e5e0a53612c621da522d2e49bc4e352dece23f30bc63'

describe('DidAuthorization', () => {
  describe('createRequirement(verificationMethod = () => true)', () => {
    it('creates requirement with default verification method', async () => {
      const requirement = DidAuthorization.createRequirement()
      expect(requirement.DidAuthorization.verificationMethod()).to.be.true
    })
  })

  describe('verify(context)', () => {
    const parameters = {
      mutation: {
        username: 'Flamie'
      }
    }

    it('throws "UnauthorizedError" if authorization header missing', async () => {
      const { statusCode, result: { error } } = await exec('CreateAccount', parameters)

      expect(statusCode).to.eql(401)
      expect(error.code).to.eql('UnauthorizedError')
      expect(error.message).to.eql('Authorization header is missing')
    })

    it('throws "UnauthorizedError" if token verification failed', async () => {
      const authorization = 'BAD_TOKEN'
      const { statusCode, result: { error } } = await exec('CreateAccount', parameters, { authorization })

      expect(statusCode).to.eql(401)
      expect(error.code).to.eql('UnauthorizedError')
    })

    it('throws "UnauthorizedError" if challenge mismatch', async () => {
      const identity  = await Identity.fromSeed(CLIENT_SEED)
      const challenge = 'BAD_CHALLENGE'

      const proofOptions = {
        domain: 'example.com',
        challenge
      }

      const authorization = await identity.createPresentation([], { format: 'jwt', proofOptions })
      const { statusCode, result: { error } } = await exec('CreateAccount', parameters, { authorization })

      expect(statusCode).to.eql(401)
      expect(error.code).to.eql('UnauthorizedError')
      expect(error.message).to.eql('Challenge mismatch')
    })

    it('throws "AccessDeniedError" if verification method failed', async () => {
      const authorization = await createDidAuthToken(CLIENT_SEED, parameters)
      const { statusCode, result: { error } } = await exec('CreateAccount', parameters, { authorization })

      expect(statusCode).to.eql(403)
      expect(error.code).to.eql('AccessDeniedError')
    })
  })
})
