'use strict'

const isString       = require('lodash.isstring')
const { Identity }   = require('@kravc/identity')
const canonicalize   = require('canonicalize')
const { createHash } = require('crypto')

const DEFAULT_TTL = 1000 * 60
const format = 'jwt'

/* istanbul ignore next */
const createAuthorization = async (identity, serviceUrl, operationId, parameters = {}) => {
  const shouldInitializeIdentity = isString(identity)

  if (shouldInitializeIdentity) {
    identity = await Identity.fromSeed(identity)
  }

  const canonicalizedParameters = canonicalize(parameters)

  const domain    = `${serviceUrl}${operationId}`
  const challenge = createHash('sha256').update(canonicalizedParameters).digest().toString('hex')
  const expirationDate = new Date(Date.now() + DEFAULT_TTL).toISOString()

  const proofOptions = { challenge, domain, expirationDate }

  const jwt = await identity.createPresentation([], { format, proofOptions })

  return jwt
}

module.exports = createAuthorization
