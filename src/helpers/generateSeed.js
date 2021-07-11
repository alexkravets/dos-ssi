'use strict'

const crypto       = require('crypto')
const { Identity } = require('@kravc/identity')

module.exports = () => crypto.randomBytes(Identity.SEED_LENGTH).toString('hex')
