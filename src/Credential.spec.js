'use strict'

const service      = require('examples/accounts')
const { expect }   = require('chai')
const { Identity } = require('@kravc/identity')
const { Create, test: { execute } } = require('@kravc/dos')
const { Credential, test: { createDidAuthToken } } = require('src')

const exec = execute(service)

const CLIENT_SEED = '72ff16adfaa40ccdf8a8e5e0a53612c621da522d2e49bc4e352dece23f30bc63'

describe('Credential(Operation, options)', () => {
  it('extends operation output with verified credential JSON format', async () => {
    const domain = 'example.com'
    const parameters = {
      mutation: {
        username: 'CAHTEP'
      }
    }

    const authorization = await createDidAuthToken(CLIENT_SEED, parameters, { domain })

    const { statusCode, result } = await exec('CreateAccount', parameters, { authorization })
    expect(statusCode).to.eql(201)
    expect(result.verifiableCredentialJson).to.exist

    const { verifiableCredentialJson } = result
    const credential = await Identity.verify(verifiableCredentialJson)

    const { credentialSubject } = credential
    expect(credentialSubject.id).to.exist
    expect(credentialSubject.username).to.eql('CAHTEP')
    expect(credentialSubject.createdAt).to.exist
  })

  it('supports operation embeded schema output', async () => {
    const Account     = require('examples/accounts/components/Account')
    const { ulid }    = require('ulid')
    const { Service } = require('@kravc/dos')

    const options = {
      issuerSeedHex:     'ad5bc1d9bb775e986b7bac4be2ac8baf570ed763eb137e9d453cfa7531c1770e',
      getCredentialId:   () => 'https://example.com/credentials/' + ulid(),
      credentialTypeUri: 'https://example.com/schema/AccountV1'
    }

    class CreateAccount extends Credential(Create(Account), options) {
      static get mutation() {
        return super.mutation.only([ 'username' ])
      }

      static get output() {
        return {
          data: {
            properties: {
              id:       { required: true },
              username: { required: true }
            },
            required: true
          }
        }
      }

      before(parameters) {
        this.context.identity = { id: 'did:HOLDER_ID'}
        return parameters
      }
    }

    const URL = 'https://example.com'
    const api = [ Account, CreateAccount ]

    const service = new Service(api, URL, '/examples/accounts')
    const exec = execute(service)

    const parameters = {
      mutation: {
        username: 'Electronic'
      }
    }

    const { statusCode, result } = await exec('CreateAccount', parameters)
    expect(statusCode).to.eql(201)
    expect(result.verifiableCredentialJson).to.exist

    const { verifiableCredentialJson } = result
    const credential = await Identity.verify(verifiableCredentialJson)

    const { credentialSubject } = credential
    expect(credentialSubject.id).to.exist
    expect(credentialSubject.username).to.eql('Electronic')
    expect(credentialSubject.createdAt).to.not.exist
  })
})
