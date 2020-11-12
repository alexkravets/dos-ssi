'use strict'

const { Identity } = require('@kravc/identity')
const { getParametersDigest } = require('../security')

const createDidAuthToken = async (seedHex, parameters, options = {}) => {
  const identity  = await Identity.fromSeed(seedHex)
  const challenge = getParametersDigest(parameters)

  const proofOptions = { challenge }

  if (options.domain) {
    proofOptions.domain = options.domain
  }

  return identity.createPresentation([], { format: 'jwt', proofOptions })
}

module.exports = createDidAuthToken
