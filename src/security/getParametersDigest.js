'use strict'

const canonicalize   = require('canonicalize')
const { stringify }  = require('querystring')
const { createHash } = require('crypto')

/* istanbul ignore next */
const getParametersDigest = (parameters = {}) => {
  const { mutation, ...query } = parameters

  const hasQuery   = Object.keys(query).length > 0
  const _parameters = {}

  /* istanbul ignore next */
  if (hasQuery) {
    _parameters.query = stringify(query)
  }

  /* istanbul ignore else */
  if (mutation) {
    _parameters.mutation = mutation
  }

  const canonized = canonicalize(_parameters)
  const digest = createHash('sha256').update(canonized).digest().toString('hex')

  return digest
}

module.exports = getParametersDigest
