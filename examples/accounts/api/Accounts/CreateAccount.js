'use strict'

const { ulid }    = require('ulid')
const { Create }  = require('@kravc/dos')
const { Account } = require('../../components')
const { Credential, security } = require('src')

const options = {
  issuerSeedHex:     'ad5bc1d9bb775e986b7bac4be2ac8baf570ed763eb137e9d453cfa7531c1770e',
  getCredentialId:   () => 'https://example.com/credentials/' + ulid(),
  credentialTypeUri: 'https://example.com/schema/AccountV1'
}

class CreateAccount extends Credential(Create(Account), options) {
  static get security() {
    const accessVerificationMethod = ({ vp }) => {
      return vp.proof.domain === 'example.com'
    }

    const requirement = security.DidAuthorization.createRequirement({ accessVerificationMethod })

    return [ requirement ]
  }

  static get mutation() {
    return super.mutation.only([ 'username' ])
  }
}

module.exports = CreateAccount
