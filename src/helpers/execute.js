'use strict'

const createAuthorization   = require('./createAuthorization')
const { test: { execute } } = require('@kravc/dos')

const _execute = service => {
  const exec = execute(service)

  /* istanbul ignore next */
  return async (identity, operationId, parameters = {}) => {
    const serviceUrl    = service.baseUrl
    const authorization = await createAuthorization(identity, serviceUrl, operationId, parameters)

    return exec(operationId, parameters, { authorization })
  }
}

module.exports = _execute
