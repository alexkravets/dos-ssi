#!/usr/bin/env node

'use strict'

const crypto       = require('crypto')
const { Identity } = require('@kravc/identity')

const seed = () => {
  const seedHex = crypto.randomBytes(Identity.SEED_LENGTH).toString('hex')
  console.log(seedHex)
}

seed()
