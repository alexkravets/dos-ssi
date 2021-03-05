'use strict'

const canonicalize   = require('canonicalize')
const { stringify }  = require('querystring')
const { createHash } = require('crypto')

const getParametersDigest = ({ mutation, ...query }) => {
  const parameters = {}

  /* istanbul ignore else */
  if (query) {
    parameters.query = stringify(query)
  }

  /* istanbul ignore else */
  if (mutation) {
    parameters.mutation = mutation
  }

  const canonized = canonicalize(parameters)
  const digest = createHash('sha256').update(canonized).digest().toString('hex')

  return digest
}

module.exports = getParametersDigest
