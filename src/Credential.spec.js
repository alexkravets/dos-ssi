'use strict'

const service      = require('example')
const { expect }   = require('chai')
const { Create }   = require('@kravc/dos')
const { Identity } = require('@kravc/identity')
const { execute, Credential } = require('src')

const exec     = execute(service)
const identity = 'a8ae17cdfa9f3e9bca58e471be3d4dc964735b10edb41e8013b2818350a2c0a5'

describe('Credential(Operation, options)', () => {
  it('extends operation output with verified credential JSON format', async () => {
    const parameters = {
      mutation: {
        username: 'CAHTEP'
      }
    }

    const { statusCode, result } = await exec(identity, 'CreateAccountCredential', parameters)
    expect(statusCode).to.eql(201)
    expect(result.verifiableCredentialJson).to.exist

    const { verifiableCredentialJson } = result
    const credential = await Identity.verify(verifiableCredentialJson)

    const { credentialSubject } = credential
    expect(credentialSubject.id).to.exist
    expect(credentialSubject.username).to.eql('CAHTEP')
    expect(credentialSubject.createdAt).to.exist
  })

  it('supports operation embeded schema output & skips credential signing', async () => {
    const { Service } = require('@kravc/dos')
    const AccountCredential = require('example/components/AccountCredential')

    class IssueAccountCredential extends Credential(Create(AccountCredential)) {
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
        this.context.identity = { id: 'did:CUSTOM_HOLDER_ID' }
        return parameters
      }
    }

    const URL = 'https://example.com/'
    const api = [ AccountCredential, IssueAccountCredential ]

    const service = new Service(api, URL, '/example')
    const exec = execute(service)

    const parameters = {
      mutation: {
        username: 'Electronic'
      }
    }

    const client = await Identity.fromSeed(identity)
    const { statusCode, result } = await exec(client, 'IssueAccountCredential', parameters)
    expect(statusCode).to.eql(201)
    expect(result.verifiableCredentialJson).to.exist
  })
})
