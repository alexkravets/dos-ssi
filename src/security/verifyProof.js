'use strict'

const get            = require('lodash.get')
const { parse }      = require('url')
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

  const { httpPath } = context

  const isHttpRequest = !!httpPath

  if (isHttpRequest) {
    const url = baseUrl + ('/' + httpPath).replace('//', '')

    const isUrlMismatch = !domain.includes(url)

    if (isUrlMismatch) {
      return [ false, 'Request URL doesn\'t match presentation proof domain' ]
    }

    const domainQuery      = parse(domain, true).query
    const domainQueryJson  = canonicalize(domainQuery)
    const contextQueryJson = canonicalize(context.query)

    const isQueryMismatch = domainQueryJson !== contextQueryJson

    if (isQueryMismatch) {
      return [ false, 'Request query parameters do not match presentation proof domain' ]
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
      return [ false, 'Operation parameters do not match presentation proof challenge' ]
    }
  }

  return [ true ]
}

module.exports = verifyProof
