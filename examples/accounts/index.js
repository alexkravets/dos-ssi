'use strict'

const { Service } = require('@kravc/dos')

const URL = 'https://example.com'
const api = [
  require('./components/Account'),
  require('./api/Accounts/CreateAccount')
]

const service = new Service(api, URL, '/examples/accounts')

module.exports = service
