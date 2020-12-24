'use strict'

const { errors }   = require('@kravc/dos')
const { Identity } = require('@kravc/identity')
const getParametersDigest = require('./getParametersDigest')

const {
  AccessDeniedError,
  UnauthorizedError
} = errors

const verifyAccess = () => true

const verifyChallenge = (context, payload) => {
  const { query, mutation } = context
  const parameters = { ...query, mutation }

  const challenge = getParametersDigest(parameters)
  const isChallengeOk = challenge === payload.vp.proof.challenge

  return isChallengeOk
}

class DidAuthorization {
  static createRequirement(options = {}) {
    const { name } = this

    return {
      [name]: {
        definition: {
          in:   'header',
          type: 'apiKey',
          name: 'Authorization',
          description: 'TODO: Add a link to presentation JWT example.'
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
    accessVerificationMethod    = verifyAccess,
    challengeVerificationMethod = verifyChallenge
  }) {
    this._verifyAccess    = accessVerificationMethod
    this._verifyChallenge = challengeVerificationMethod
  }

  async verify(context) {
    const { authorization: token } = context.headers

    if (!token) {
      const error = new UnauthorizedError('Authorization header is missing')
      return { isAuthorized: false, error }
    }

    let payload

    try {
      payload = await Identity.verify(token)

    } catch (_error) {
      const { message } = _error
      const error = new UnauthorizedError(message)

      return { isAuthorized: false, error }
    }

    const isChallengeOk = this._verifyChallenge(context, payload)

    if (!isChallengeOk) {
      const error = new UnauthorizedError('Challenge mismatch')

      return { isAuthorized: false, error }
    }

    const isAuthorized = this._verifyAccess(payload)

    if (!isAuthorized) {
      const error = new AccessDeniedError()
      return { isAuthorized: false, error }
    }

    const presentation   = payload.vp
    const { holder: id } = presentation

    return { isAuthorized: true, id, accountId: id, presentation }
  }
}

module.exports = DidAuthorization
