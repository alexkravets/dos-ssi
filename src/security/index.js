'use strict'

const DidAuthorization = require('./DidAuthorization')

/* istanbul ignore next */
module.exports = (options = {}) => {
  const requirement = DidAuthorization.createRequirement(options)
  return [ requirement ]
}
