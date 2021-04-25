'use strict'

const { Create }               = require('@kravc/dos')
const { AccountCredential }    = require('../../components')
const { Credential, security } = require('src')

const { DidAuthorization } = security
const { options } = AccountCredential

const DID_BLACKLIST = [
  'did:key:zQ3shSnvnzi7fihHWfYpGwwJ17fg5k9m9LphGZ2VYXCTqAdbs'
]

class CreateAccountCredential extends Credential(Create(AccountCredential), options) {
  static get security() {
    const accessVerificationMethod = (context, jwtPayload) => {
      const isBlacklisted = DID_BLACKLIST.includes(jwtPayload.iss)

      if (isBlacklisted) {
        return [ false, 'Access denied' ]
      }

      return [ true ]
    }

    const requirement = DidAuthorization.createRequirement({ accessVerificationMethod })

    return [ requirement ]
  }

  static get mutation() {
    return super.mutation.only([ 'username' ])
  }
}

module.exports = CreateAccountCredential
