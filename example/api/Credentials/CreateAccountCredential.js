'use strict'

const { Create }               = require('@kravc/dos')
const { AccountCredential }    = require('../../components')
const { Credential, security } = require('src')

const DID_BLACKLIST = [
  'did:key:zQ3shSnvnzi7fihHWfYpGwwJ17fg5k9m9LphGZ2VYXCTqAdbs'
]

const { options } = AccountCredential

class CreateAccountCredential extends Credential(Create(AccountCredential), options) {
  static get security() {
    const accessVerificationMethod = (context, jwtPayload) => {
      const isBlacklisted = DID_BLACKLIST.includes(jwtPayload.iss)

      if (isBlacklisted) {
        return [ false, 'Access denied' ]
      }

      return [ true ]
    }

    return security({ accessVerificationMethod })
  }

  static get mutation() {
    return super.mutation.only([ 'username' ])
  }
}

module.exports = CreateAccountCredential
