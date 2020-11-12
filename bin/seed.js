#!/usr/bin/env node

'use strict'

const crypto = require('crypto')

const SEED_LENGTH = 32

const seed = () => {
  const seedHex = crypto.randomBytes(SEED_LENGTH).toString('hex')
  console.log(seedHex)
}

seed()
