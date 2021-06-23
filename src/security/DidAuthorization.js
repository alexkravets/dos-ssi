'use strict'

const { errors }   = require('@kravc/dos')
const verifyProof  = require('./verifyProof')
const { Identity } = require('@kravc/identity')

const {
  AccessDeniedError,
  UnauthorizedError
} = errors

class DidAuthorization {
  static createRequirement(options = {}) {
    const { name } = this

    return {
      [name]: {
        definition: {
          in:   'header',
          type: 'apiKey',
          name: 'Authorization',
          description: 'Verifiable presentation token in JWT format'
        },
        klass: this,
        ...options
      }
    }
  }

  static get errors() {
    return {
      UnauthorizedError: {
        statusCode:  401,
        description: 'Request authorization failed'
      },
      AccessDeniedError: {
        statusCode:  403,
        description: 'Operation access denied'
      }
    }
  }

  constructor({
    proofVerificationMethod  = verifyProof,
    accessVerificationMethod = () => [ true ]
  }) {
    this._verifyProof  = proofVerificationMethod
    this._verifyAccess = accessVerificationMethod
  }

  async verify(context) {
    const { authorization } = context.headers

    if (!authorization) {
      const error = new UnauthorizedError('Authorization header is missing')
      return { isAuthorized: false, error }
    }

    let tokenPayload

    try {
      const token  = authorization.replace('Bearer ', '')
      tokenPayload = await Identity.verify(token)

    } catch (_error) {
      const { message } = _error
      const error = new UnauthorizedError(`Presentation verification error: ${message}`)

      return { isAuthorized: false, error }
    }

    const [ isProofOk, proofErrorMessage ] = await this._verifyProof(context, tokenPayload)

    if (!isProofOk) {
      const error = new UnauthorizedError(proofErrorMessage)

      return { isAuthorized: false, error }
    }

    const [ hasAccess, accessErrorMessage ] = await this._verifyAccess(context, tokenPayload)

    if (!hasAccess) {
      const error = new AccessDeniedError(accessErrorMessage)
      return { isAuthorized: false, error }
    }

    const presentation   = tokenPayload.vp
    const { holder: id } = presentation

    return { isAuthorized: true, id, accountId: id, presentation }
  }
}

module.exports = DidAuthorization
