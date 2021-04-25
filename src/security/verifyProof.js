'use strict'

const get            = require('lodash.get')
const canonicalize   = require('canonicalize')
const { createHash } = require('crypto')

const verifyProof = (context, tokenPayload) => {
  const domain    = get(tokenPayload, 'vp.proof.domain')
  const challenge = get(tokenPayload, 'vp.proof.challenge')

  if (!domain) {
    return [ false, 'Presentation proof should include domain' ]
  }

  const { baseUrl, operationId } = context

  const operationUrl     = `${baseUrl}${operationId}`
  const isDomainMismatch = !domain.startsWith(operationUrl)

  if (isDomainMismatch) {
    return [ false, `Presentation proof domain should start with ${operationUrl}` ]
  }

  const { url } = context

  const isHttpRequest = !!url

  if (isHttpRequest) {
    const isUrlMismatch = url !== domain

    if (isUrlMismatch) {
      return [ false, 'Request URL doesn\'t match presentation proof domain' ]
    }

    const { bodyJson } = context

    /* istanbul ignore else */
    if (bodyJson) {
      if (!challenge) {
        return [ false, 'Presentation proof should include challenge, sha256 from body JSON' ]
      }

      const digest = createHash('sha256').update(bodyJson).digest().toString('hex')

      const isChallengeMismatch = challenge !== digest

      if (isChallengeMismatch) {
        return [ false, 'Request body JSON doesn\'t match presentation proof challenge' ]
      }
    }

  } else {
    const { query, mutation } = context
    const parameters = { ...query }

    /* istanbul ignore else */
    if (mutation) {
      parameters.mutation = mutation
    }

    const canonicalizedParameters = canonicalize(parameters)
    const digest = createHash('sha256').update(canonicalizedParameters).digest().toString('hex')

    const isChallengeMismatch = challenge !== digest

    if (isChallengeMismatch) {
      return [ false, 'Operation parameters doesn\'t match presentation proof challenge' ]
    }
  }

  return [ true ]
}

module.exports = verifyProof
